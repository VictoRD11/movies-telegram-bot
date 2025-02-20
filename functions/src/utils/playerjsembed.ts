import superagent from 'superagent'
import { File } from '../types/index'
import convertPlayerJSPlaylist, { parseSubTitleString } from './convertPlayerJSPlaylist'
import stripPlayerJSConfig from './stripPlayerJSConfig'
import { tunnelHttpsAgent } from './tunnelAgent'
import debugFactory from 'debug'

const debug = debugFactory('playerjsembed')

export default async (url: string, proxy = false): Promise<File[]> => {
  let res
  try {
    const tragetUrl = url.startsWith('//') ? 'https:' + url : url

    const req = proxy ?
      superagent.get(tragetUrl).agent(tunnelHttpsAgent) :
      superagent.get(tragetUrl)

    res = await req.disableTLSCerts()
  } catch (e) {
    debug('Fail get iframe', url, e)
    return []
  }

  const config = stripPlayerJSConfig(res.text)

  if (config) {
    const { file, subtitle } = config
    const files = convertPlayerJSPlaylist(file)

    if(files.length == 1 && subtitle) {
      files[0].subtitle = parseSubTitleString(subtitle)
    }

    return files
  }

  return []
}