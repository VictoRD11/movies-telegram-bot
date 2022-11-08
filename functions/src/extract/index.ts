
import makeResponse from '../utils/makeResponse.js'
import animevostExtractor from './animevostExtractor.js'
import kinogoExtractor from './kinogoExtractor.js'
import m3u8Extractor from './m3u8Extractor.js'
import anigitExtractor from './anigitExtractor.js'
import sibnetHlsExtractor from './sibnetHlsExtractor.js'
import sibnetMp4Extractor from './sibnetMp4Extractor.js'
import mp4PExtractor from './mp4Extractor.js'
import anidubExtractor from './anidubExtractor.js'
import { APIGatewayProxyResult } from 'aws-lambda'
import { ExtractorTypes } from '../types/index.js'

export interface ExtractorParams {
  type: ExtractorTypes
  url: string
  [key: string]: string
}
export type Extractor = (params: ExtractorParams, headers: Record<string, string>) => Promise<APIGatewayProxyResult>

const extractors: Record<ExtractorTypes, Extractor> = {
  animevost: animevostExtractor,
  kinogo: kinogoExtractor,
  tortuga: m3u8Extractor,
  ashdi: m3u8Extractor,
  anigit: anigitExtractor,
  animedia: m3u8Extractor,
  sibnethls: sibnetHlsExtractor,
  sibnetmp4: sibnetMp4Extractor,
  stormo: mp4PExtractor,
  anidub: anidubExtractor,
  mp4: mp4PExtractor,
  m3u8: m3u8Extractor,
  mp4local: mp4PExtractor,
  m3u8local: m3u8Extractor
}
export default async (parmas: ExtractorParams, headers: Record<string, string>): Promise<APIGatewayProxyResult> => {
  if (!parmas)
    return makeResponse({ message: 'No extractor parmas' }, 404)

  const { type } = parmas
  const extractor = extractors[type]

  if (!extractor)
    return makeResponse({ message: 'No extractor found' }, 404)

  return await extractor(parmas, headers)
}