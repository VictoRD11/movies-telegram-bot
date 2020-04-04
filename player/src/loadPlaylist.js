import React from 'react'
import { render } from 'react-dom'

import App from './App'
import playerStore from './store/player-store'
import logger from './utils/logger'
import analytics from './utils/analytics'
import store from './utils/storage'
import localization from './localization'

const urlParams = new URLSearchParams(window.location.search)
const provider = urlParams.get('provider') || store.get('provider')
const id = urlParams.get('id') || store.get('id')


function renderError(message, err) {
    message = message || localization.cantLoadPLaylist

    document.querySelector('#app .loader').textContent = message

    analytics('load', 'error', message)

    logger.error(message, {
        provider,
        id,
        href: location.href,
        err
    })
}

function renderVideoNotReleased(trailerUrl) {
    document.querySelector('#app .loader').innerHTML = 
        localization.formatString(localization.videoNotReleased, trailerUrl)
}


export default function () {
    const uid = store.get('uid') 
    if (window.mixpanel && uid) {
        mixpanel.identify(uid)
    }

    if (window.gtag) {
        gtag('js', new Date())
        if(uid) {
            gtag('config', 'UA-153629378-1', { 'user_id': uid })
        } else {
            gtag('config', 'UA-153629378-1')
        }
    }

    if (provider && id) {
        store.set('provider', provider)
        store.set('id', id)

        fetch(`${window.API_BASE_URL}/trackers/${provider}/items/${encodeURIComponent(id)}`)
            .then((response) => response.json())
            .then((playlist) => {
                if (playlist && playlist.files && playlist.files.length) {
                    const fileIndex = parseInt(urlParams.get('file'))
                    const time = parseFloat(urlParams.get('time'))

                    playerStore.openPlaylist({ id, provider, ...playlist }, fileIndex, time)

                    analytics('open', 'playlist', document.title)

                    render((<App />), document.getElementById('app'))
                } else if(playlist && playlist.trailer) {
                    renderVideoNotReleased(playlist.trailer)
                } else {
                    renderError(localization.videoNotFound)
                }
            })
            .catch((e) => renderError(null, { message: e.message }))
    } else {
        renderError()
    }
}