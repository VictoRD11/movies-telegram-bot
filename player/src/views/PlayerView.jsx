import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import Player from '../components/Player'
import { inject, observer } from 'mobx-react'
import { IconButton, Fab } from '@material-ui/core'
import { 
    PlayCircleFilled as PlayIcon,
    Cast as CastIcon,
} from '@material-ui/icons'
import { isTouchDevice } from '../utils'
import analytics from '../utils/analytics'

import CastDialog from '../components/CastDialog'

@inject(
    ({ 
        castStore: { showCastDialog, castAvalaible },
        playerStore: { device: { playlist, play }}
    }) => ({ 
        showCastDialog,
        castAvalaible,
        playlist, 
        play 
    })
)
@observer
class PlayerView extends Component {
    constructor(props, context) {
        super(props, context)

        this.state = {
            started: props.started,
            initialFullScreen: false
        }
    }

    handleStartClick = () => {
        this.setState({ started: true })
        if(isTouchDevice()) {
            this.setState({ initialFullScreen: true })
        }
        this.props.play()
        analytics('start', 'video', document.title)
    }

    handleCastClick = (e) => {
        e.stopPropagation()
        this.props.showCastDialog(() => {
            this.setState({ started: true })
        })
    }

    renderStartScrean = () => {
        const { playlist: { image }, castAvalaible } = this.props

        return (
            <div 
                className="player__pause-cover player__background-cover" 
                style={{ backgroundImage: image ? `url(${image})`: null, cursor: 'pointer' }}
                onClick={this.handleStartClick}
            >
                <PlayIcon className="center shadow-icon" fontSize="inherit"/>
                {castAvalaible && <div className="player__start-cast-button">
                    <Fab onClick={this.handleCastClick} size="large">
                        <CastIcon/>
                    </Fab>
                </div>}
            </div>
        )
    }

    render() {
        const { started, initialFullScreen } = this.state

        return (
            <Fragment>
                {!started && this.renderStartScrean()}
                {started && <div className="screan-content">
                    <Player initialFullScreen={initialFullScreen} />
                </div>}
                <CastDialog/>
            </Fragment>
        )
    }
}

PlayerView.propTypes = {
    showCastDialog: PropTypes.func,
    playlist: PropTypes.object,
    play: PropTypes.func,
    isLocal: PropTypes.func,
    started: PropTypes.bool,
    castAvalaible: PropTypes.bool
}

export default PlayerView