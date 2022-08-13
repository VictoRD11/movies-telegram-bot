module.exports = {
    'timeout': 5,
    'infoTimeout': 20,
    'pageSize': 10,
    'userAgent': 'Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0',
    'videocdn': {
        'baseUrl': 'https://videocdn.tv/api',
        'types': ['tv-series', 'movies', 'show-tv-series', 'animes', 'anime-tv-series'],
        'token': 'BuKYUNoUnwQ560ZbZMIaNkFA4eTkIQk7'
    },
    'anidub': {
        'baseUrl': 'https://anime.anidub.life',
        'searchUrl': 'https://anime.anidub.life/index.php?do=search',
    },
    'animedia': {
        'baseUrl': 'https://m46.animedia.pro',
        'searchUrl': 'https://m46.animedia.pro/ajax/search_result_search_page_2/P0'
    },
    'anigato': {
        'cfbypass': true,
        'baseUrl': 'https://anigato.ru/',
        'searchUrl': 'https://anigato.ru/index.php?do=search',
        'token': '447d179e875efe44217f20d1ee2146be'
    },
    'anitubeua': {
        'timeout': 10,
        'imagesUrl': 'https://anitube.in.ua',
        'baseUrl': 'https://85.208.185.25',
        'searchUrl': 'https://85.208.185.25/index.php?do=search',
        'headers': {
            'Host': 'anitube.in.ua'
        }
    },
    'kinovod': {
        'baseUrl': 'https://kinovod339.cc',
        'searchUrl': 'https://kinovod339.cc/search'
    },
    'animevost': {
        'baseUrl': 'https://animevost.org',
        'searchUrl': 'https://animevost.org/index.php?do=search',
        'playerUrl': 'https://play.animegost.org',
    },
    'kinogo': {
        'infoTimeout': 20,
        'baseUrl': 'https://kinogo.la',
        'searchUrl': 'https://kinogo.la/index.php?do=search'
    },
    'eneyida': {
        'cfbypass': true,
        'baseUrl': 'https://eneyida.tv',
        'searchUrl': 'https://eneyida.tv/index.php?do=search'
    },
    'seasonvar': {
        'pageSize': 30,
        'encryptKey': 'ololo',
        'baseUrl': 'http://seasonvar.ru',
        'searchUrl': 'http://seasonvar.ru/autocomplete.php'
    }
}