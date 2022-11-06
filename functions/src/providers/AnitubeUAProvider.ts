import Provider from './DataLifeProvider'
import urlencode from 'urlencode'
import superagent from 'superagent'
import $, { AnyNode, Cheerio } from 'cheerio'
import providersConfig from '../providersConfig'
import { File, FileUrl } from '../types'
import { ProcessingInstruction } from 'domhandler'

const playesRegExp = /RalodePlayer\.init\((.*),(\[\[.*\]\]),/
const srcRegExp = /src="([^"]+)"/

interface ExtratorConfig {
  type: string
  hls?: boolean
}

const extractors: Record<string, ExtratorConfig | null> = {
  'ashdi': {
    type: 'ashdi',
    hls: true
  },
  'sibnet': {
    type: 'sibnetmp4'
  },
  'secvideo1': {
    type: 'mp4local'
  },
  'csst.online': {
    type: 'mp4local'
  },
  'veoh.com': null,
  'tortuga.wtf': {
    type: 'tortuga',
    hls: true
  }
}

class AnitubeUAProvider extends Provider {
  protected searchScope = '.story'
  protected searchSelector = {
    id: {
      selector: '.story_c > h2 > a',
      transform: ($el: Cheerio<AnyNode>): string => urlencode($el.attr('href') ?? '')
    },
    name: '.story_c > h2 > a',
    image: {
      selector: '.story_post > img',
      transform: ($el: Cheerio<AnyNode>): string => this.absoluteUrl($el.attr('src') ?? '')
    }
  }
  protected override infoScope = '.story'
  protected infoSelectors = {
    title: '.story_c h2',
    image: {
      selector: '.story_post img',
      transform: ($el: Cheerio<AnyNode>): string => this.absoluteUrl($el.attr('src') ?? '')
    },
    files: {
      selector: ['#VideoConstructor_v3_x_Player', '.playlists-ajax'],
      transform: ($el: Cheerio<AnyNode>): Promise<File[]> | File[] => {
        if ($el.attr('id') == 'VideoConstructor_v3_x_Player') {
          return this.filesFromVideoContructor($el)
        } else {
          return this.filesFromPlaylistAjax($el)
        }
      }
    },
    trailer: {
      selector: 'a.rollover',
      transform: ($el: Cheerio<AnyNode>): string | undefined => {
        const url = $el.attr('href')
        return url?.replace('youtube.com/watch?v=', 'youtube.com/embed/')
      }
    }
  }

  constructor() {
    super('anitubeua', providersConfig.providers.anitubeua)
  }

  private async filesFromPlaylistAjax($el: Cheerio<AnyNode>): Promise<File[]> {
    // https://anitube.in.ua/1866-legenda-pro-korru-2.html

    const newsId = $el.attr('data-news_id')
    const res = await superagent
      .get(`${this.config.baseUrl}/engine/ajax/playlists.php?news_id=${newsId}&xfield=playlist`)
      .set(this.config.headers!)
      .timeout(5000)
      .disableTLSCerts()

    const files: File[] = []

    const $playlist = $(res.body.response)
    $playlist.find('.playlists-videos .playlists-items li')
      .toArray()
      .forEach((el) => {
        const $el = $(el)
        const [id] = $el.attr('data-id')!.split('_')
        const url = $el.attr('data-file')!

        const extractorName = Object.keys(extractors).find((extr) => url.indexOf(extr) != -1)

        if (!extractorName)
          return

        this.addFile(files, parseInt(id), null, url, extractors[extractorName])
      })

    return files
  }

  private filesFromVideoContructor($el: Cheerio<AnyNode>): File[] {
    const script = $el.prev('script').get()[0].children[0] as ProcessingInstruction
    const matches = script.data.match(playesRegExp)

    if (!matches || matches.length < 1)
      return []

    const audios = JSON.parse(matches[1]) as string[]
    const videos = JSON.parse(matches[2]) as { code: string }[][]

    const files: File[] = []

    videos.forEach((episodes, i) => {
      const audio = audios[i]

      let id = 0
      for (const episode of episodes) {
        const { code } = episode

        const srcMatch = code.match(srcRegExp)

        if (!srcMatch || srcMatch.length < 1)
          return

        const url = srcMatch[1]
        const extractorName = Object.keys(extractors).find((extr) => url.indexOf(extr) != -1)

        if (!extractorName)
          return

        this.addFile(files, id, audio, url, extractors[extractorName])

        id++
      }
    })

    return files
  }

  addFile(files: File[], index: number, audio: string | null, url: string, extractor: ExtratorConfig | null): void {
    const file = files[index] || {
      id: index,
      name: `Episode ${index + 1}`,
      urls: []
    }

    files[index] = file
    const fileUrl: FileUrl = { url }
    if (audio) fileUrl.audio = audio

    if (extractor) {
      fileUrl.extractor = { type: extractor.type }
      if (extractor.hls) {
        fileUrl.hls = true
      }
    }
    file.urls!.push(fileUrl)
  }
}

export default AnitubeUAProvider