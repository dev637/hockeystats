import React, { Component } from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getPlayerList } from '../actions/statActions'
import configure from '../utils/configLocalforage'
import DashboardProfiles from './DashboardProfiles'
import { CircularProgress, Button } from '@material-ui/core/'

class Dashboard extends Component {
  constructor() {
    super()
    this.state = {
      trackedPlayerData: [],
    }

    this._isMounted = false
  }

  async componentDidMount() {
    const { trackedPlayers } = this.props.stats
    this._isMounted = true

    if (trackedPlayers.length) {
      await configure().then(async api => {
        const trackedPlayerData = await Promise.all(
          trackedPlayers.map(obj =>
            api
              .get(`/api/statistics/players/${obj.playerId}`)
              .then(res => ({ ...res.data, seasonId: obj.seasonId }))
          )
        )
        if (this._isMounted) {
          this.setState({ trackedPlayerData })
        }
      })
    }

    if (!this.props.auth.isAuthenticated) {
      window.addEventListener(
        'beforeunload',
        this.playersToLocalStorage.bind(this)
      )
    }
  }

  componentWillUnmount() {
    this._isMounted = false

    if (!this.props.auth.isAuthenticated && !this.props.auth.loading) {
      window.removeEventListener(
        'beforeunload',
        this.playersToLocalStorage.bind(this)
      )
      this.playersToLocalStorage()
    }
  }

  playersToLocalStorage() {
    const { trackedPlayers } = this.props.stats
    if (typeof window !== 'undefined') {
      localStorage.setItem('players', JSON.stringify(trackedPlayers))
    }
  }

  render() {
    const { trackedPlayerData } = this.state
    const { trackedPlayers } = this.props.stats
    const filterTrackedPlayerData = trackedPlayerData.filter(dataObj =>
      trackedPlayers.some(
        listObj =>
          listObj.playerId === dataObj.id &&
          listObj.seasonId === dataObj.seasonId
      )
    )

    return (
      <div>
        <h1>Dashboard</h1>
        <br />
        {trackedPlayers.length ? (
          filterTrackedPlayerData.length ? (
            <DashboardProfiles trackedPlayerData={filterTrackedPlayerData} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CircularProgress />
            </div>
          )
        ) : (
          <div>No players selected for tracking.</div>
        )}
        <div>
          <Button
            component={Link}
            to="/app/playerstats"
            color="secondary"
            variant="contained"
            size="large"
            style={{ marginTop: '1rem' }}
          >
            Player Statistics
          </Button>
        </div>
      </div>
    )
  }
}

Dashboard.propTypes = {
  getPlayerList: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  stats: PropTypes.object.isRequired,
}

const mapStateToProps = state => ({
  auth: state.auth,
  stats: state.stats,
})

export default connect(
  mapStateToProps,
  { getPlayerList }
)(Dashboard)
