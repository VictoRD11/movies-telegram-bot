import { AnyNode, Cheerio, Document, load } from 'cheerio'
import superagent from 'superagent'
import invokeCFBypass from './invokeCFBypass'
import superagentCharset from 'superagent-charset'

export const superagentWithCharset = superagentCharset(superagent)
interface Response {
  text: string
}

export type RequestGenerator = (url: string) => Promise<Response>
export type Transform<T = unknown> = ($el: Cheerio<AnyNode>, $root: Cheerio<Document>, url: string) => Promise<T> | T
export interface SelectorConfig<T = unknown> {
  selector?: string | string[]
  transform: Transform<T>
}
export type Selector<T = unknown> = string | string[] | SelectorConfig<T>

class Crawler<Item> {
  private _requestGenerator: RequestGenerator
  private _url: string
  private _cfbypass = false
  private _timeoutMs: number
  private _headers: Record<string, string>
  private _scope: string
  private _selectors: { [key in keyof Item]?: Selector }
  private _pagenatorSelector: string
  private _limit: number

  constructor(url: string, requestGenerator?: RequestGenerator) {
    this._requestGenerator = requestGenerator ?? ((nextUrl: string): Promise<Response> => {
      if (this._cfbypass) {
        return this._createCFBypassRequest(nextUrl)
      } else {
        return this._createDefaultRequest(nextUrl)
      }
    })
    this._url = url
  }

  async _createCFBypassRequest(nextUrl: string): Promise<Response> {
    return await invokeCFBypass(nextUrl, 'get', this.headers)
  }

  _createDefaultRequest(nextUrl: string): Promise<Response> {
    const targetUrl = nextUrl != this._url ?
      new URL(nextUrl, this._url).toString() :
      nextUrl

    const request = superagentWithCharset
      .get(targetUrl)

    return request
      .buffer(true)
      .charset()
      .timeout(this._timeoutMs)
      .disableTLSCerts()
      .set(this._headers ?? {})
  }

  cfbypass(bypass: boolean): Crawler<Item> {
    this._cfbypass = bypass
    return this
  }

  headers(headers: Record<string, string>): Crawler<Item> {
    this._headers = headers
    return this
  }

  scope(scope: string): Crawler<Item> {
    this._scope = scope
    return this
  }

  set(selectors: { [key in keyof Item]?: Selector }): Crawler<Item> {
    this._selectors = selectors
    return this
  }

  paginate(pagenatorSelector: string): Crawler<Item> {
    this._pagenatorSelector = pagenatorSelector
    return this
  }

  limit(limit: number): Crawler<Item> {
    this._limit = limit
    return this
  }

  timeout(ms: number): Crawler<Item> {
    this._timeoutMs = ms
    return this
  }

  async _extractData(
    $el: Cheerio<AnyNode>,
    $root: Cheerio<Document>,
    selector: Selector,
    url: string
  ): Promise<unknown> {
    let transform: Transform = ($el: Cheerio<Document>) => Promise.resolve($el.first().text().trim())
    let selectorQuery: string | string[] | null = null

    const selectorConfig = selector as SelectorConfig
    if (selectorConfig.transform !== undefined) {
      transform = selectorConfig.transform
    }

    if (selectorConfig.selector !== undefined) {
      selectorQuery = selectorConfig.selector
    }

    if (typeof selectorQuery === 'string') {
      $el = $el.find(selectorQuery)
    } else if (Array.isArray(selectorQuery)) {
      let $r
      for (const s of selectorQuery) {
        $r = $el.find(s)
        if ($r.length) break
      }
      if (!$r) return null
      $el = $r
    }

    if ($el.length) {
      return await transform($el, $root, url)
    } else {
      return null
    }
  }

  gather(): Promise<Item[]> {
    if (!this._scope) {
      throw Error('No scope selected')
    }

    if (!this._selectors) {
      throw Error('No selectors set')
    }

    const results: Item[] = []

    const step = async (currentUrl: string): Promise<Item[]> => {
      const res = await this._requestGenerator(currentUrl)

      const $ = load(res.text, { xmlMode: false })

      const nextUrl =
        this._pagenatorSelector &&
        $(this._pagenatorSelector).attr('href')

      let limitReached = false

      for (const el of $(this._scope)) {
        const item: Record<string, unknown> = {}

        for (const selectorName in this._selectors) {
          const selector = this._selectors[selectorName]
          if (selector !== undefined) {
            item[selectorName] = await this._extractData($(el), $.root(), selector, currentUrl)
          }
        }

        results.push(item as Item)

        if (this._limit && results.length >= this._limit) {
          limitReached = true
          break
        }
      }

      if (!nextUrl || limitReached) {
        return results
      }

      return step(nextUrl)
    }

    return step(this._url)
  }
}

export default {
  Crawler,
  get<Item>(url: string, requestGenerator?: RequestGenerator): Crawler<Item> {
    return new Crawler<Item>(url, requestGenerator)
  }
}
