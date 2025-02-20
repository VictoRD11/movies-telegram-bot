import CrawlerProvider, { InfoSelectors, SearchSelectors } from './CrawlerProvider'
import providersConfig from '../providersConfig'
import { AnyNode } from 'domhandler'
import { Cheerio, CheerioAPI } from 'cheerio'
import { Extractor, File, FileUrl } from '../types'
import superagent from 'superagent'
import { load } from 'cheerio'
import { lastPathPart } from '../utils/url'

const NEW_LINE_REGEXP = /\n/g

class AnimegoProvider extends CrawlerProvider {
  protected searchScope = '.animes-grid-item'
  protected searchSelector: SearchSelectors = {
    id: {
      selector: '.animes-grid-item-body .h5 a',
      transform: ($el: Cheerio<AnyNode>): string => lastPathPart($el.attr('href'))
    },
    image: {
      selector: '.animes-grid-item-picture .anime-grid-lazy',
      transform: ($el: Cheerio<AnyNode>): string => this.absoluteUrl($el.attr('data-original') ?? '')
    },
    name: {
      selector: '.animes-grid-item-body',
      transform: ($el: Cheerio<AnyNode>): string => {
        const title = $el.find('.card-title').text()
        const year = $el.find('.anime-year').text()

        return `${title} (${year})`
      }
    }
  }
  protected infoScope = '#content'
  protected infoSelectors: InfoSelectors = {
    title: '.anime-title h1',
    image: {
      selector: '.anime-poster img',
      transform: ($el: Cheerio<AnyNode>): string => this.absoluteUrl($el.attr('src') ?? '')
    },
    files: {
      transform: async (_, { additionalParams }): Promise<File[]> => {
        const id = additionalParams!.id

        const parts = id.split('-')
        const playerId = parts[parts.length - 1]

        const { timeout, baseUrl, headers } = this.config
        const res = await superagent
          .get(`${baseUrl}/anime/${playerId}/player?_allow=true`)
          .set(headers!)
          .set('X-Requested-With', 'XMLHttpRequest')
          .timeout(timeout!)

        const $ = load(res.body.content)

        const series = $('.video-player-bar-series-list .video-player-bar-series-item')
          .toArray()
          .map((el, index) => {
            const $el = $(el)

            return {
              id: index,
              name: 'Episode ' + $el.text(),
              asyncSource: {
                sourceId: $el.data('id') as string,
                params: { ep: index + 1 }
              }
            }
          })

        if (series.length > 0) {
          return series
        }

        const $tabs = $('.video-player-toggle')
        const urls = this.getFileUrls($, $tabs)

        return [{
          id: 0,
          name: null,
          urls
        }]
      }
    }
  }

  constructor() {
    super('animego', providersConfig.providers.animego)
  }

  getSearchUrl(query: string): string {
    const { searchUrl } = this.config

    return `${searchUrl}?q=${encodeURIComponent(query)}`
  }

  override getInfoUrl(id: string): string {
    const { baseUrl } = this.config

    return `${baseUrl}/anime/${id}`
  }

  override async getSource(resultsId: string, sourceId: string, params: Record<string, string>): Promise<Partial<File> | null> {
    const { timeout, baseUrl, headers } = this.config

    const res = await superagent
      .get(`${baseUrl}/anime/series?episode=${params.ep}&id=${sourceId}`)
      .set(headers!)
      .set('X-Requested-With', 'XMLHttpRequest')
      .timeout(timeout!)

    const $ = load(res.body.content)
    const $tabs = $('.video-player-toggle')
    const urls = this.getFileUrls($, $tabs)

    return { urls }
  }

  private getFileUrls($: CheerioAPI, $tabs: Cheerio<AnyNode>): FileUrl[] {
    const translations = $tabs.eq(0)
      .find('.video-player-toggle-item')
      .toArray()
      .reduce<Record<string, string>>((acc, el) => {
        const $el = $(el)
        const dubbing = $el.data('dubbing') as string

        if (dubbing) {
          acc[dubbing] = $el.text().replace(NEW_LINE_REGEXP, '').trim()
        }

        return acc
      }, {})

    return $tabs.eq(1)
      .find('.video-player-toggle-item')
      .toArray()
      .map<FileUrl>((el) => {
        const $el = $(el)
        const dubbing = $el.data('provide-dubbing') as string
        const player = $el.data('player') as string

        return {
          url: player,
          audio: translations[dubbing],
          extractor: this.getExtractor(player),
          hls: true
        }
      })
      .filter(({ extractor }) => extractor)
  }

  private getExtractor(url: string): Extractor | undefined {
    if (url.includes('kodik')) {
      return { type: 'animego_kodik' }
    }
    // else if (url.includes('aniboom')) {
    //   return { type: 'aniboom' }
    // }

    return
  }
}

export default AnimegoProvider