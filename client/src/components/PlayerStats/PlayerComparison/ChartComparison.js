import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  Input,
  FormControl,
  InputLabel,
  NativeSelect,
  FormControlLabel,
  Switch,
} from '@material-ui/core'
import CircularProgress from '@material-ui/core/CircularProgress'
import { RadioButtonChecked, RadioButtonUnchecked } from '@material-ui/icons'
import chroma from 'chroma-js'
import styled from 'styled-components'
import { DatePicker } from 'material-ui-pickers'
import configure from '../../../utils/configLocalforage'
import { startLoad, stopLoad } from '../../../actions/statActions'
import { skaterLogStats, goalieLogStats } from '../../../helper/chartComparisonHelper'
import StatsChart from './StatsChart'

const colorFunc = chroma.cubehelix().lightness([0.3, 0.7])

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 0.8rem;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  cursor: pointer;
`

const yearFormat = seasonId => {
  const seasonIdFormat = seasonId.split('')
  seasonIdFormat.splice(4, 0, '-')
  return `(${seasonIdFormat.join('')})`
}

class ChartComparison extends Component {
  constructor() {
    super()
    this.state = {
      playerData: [],
      playerStat: '',
      summed: true,
      percentAvg: false,
      activeLines: '',
      hover: '',
      statOptions: '',
      startDate: '',
      endDate: '',
    }

    this._isMounted = false
  }

  async componentDidMount() {
    const { selectedPlayers, data, dataType, tableSettings } = this.props
    const { yearStart, yearEnd } = tableSettings
    this._isMounted = true
    const playerIds = selectedPlayers.map(playerStr => playerStr.split('-'))
    let isAggregate = false
    if (playerIds.length) {
      this.props.startLoad()
      await configure().then(async api => {
        let gameLogCollection = await Promise.all(
          playerIds.map(async playerArr => {
            const [playerId, seasonId] = playerArr
            if (seasonId) {
              return api
                .get(
                  `/api/statistics/players/gameLog/playerId/${playerId}/seasonId/${seasonId}/dataType/${dataType}`
                )
                .then(res => res.data.reverse())
            } else {
              isAggregate = true
              const count = yearEnd.slice(0, 4) - yearStart.slice(0, 4) + 1

              let seasonIdArr = []
              let yearBase = yearStart.slice(0, 4)
              let tempSeasonId

              for (let i = 1; i < count + 1; i++) {
                tempSeasonId = yearBase.concat(parseInt(yearBase) + 1)
                seasonIdArr.push(tempSeasonId)
                yearBase = (parseInt(yearBase) + 1).toString()
              }

              return Promise.all(
                seasonIdArr.map(async seasonId =>
                  api
                    .get(
                      `/api/statistics/players/gameLog/playerId/${playerId}/seasonId/${seasonId}/dataType/${dataType}`
                    )
                    .then(res => res.data.reverse())
                )
              )
            }
          })
        )

        if (isAggregate) {
          gameLogCollection = gameLogCollection.map(singlePlayerLogs =>
            singlePlayerLogs.reduce((a, b) => a.concat(b))
          )
        }

        let allStatOptions =
          data[0].playerPositionCode !== 'G' ? skaterLogStats : goalieLogStats

        let statOptions = []
        for (const playerGameLogArr of gameLogCollection) {
          for (const playerGameLog of playerGameLogArr) {
            for (const statKey in playerGameLog.stat) {
              if (!statOptions.includes(statKey)) {
                statOptions.push(statKey)
              }
            }
          }
        }

        statOptions = allStatOptions.filter(statObj =>
          statOptions.includes(statObj.key)
        )

        let playerStat = statOptions[0].key

        const playerData = selectedPlayers.map((tag, i) => {
          const tableData = data.find(
            playerObj => playerObj.playerId === parseInt(playerIds[i])
          )
          return {
            tag,
            tableData,
            gameLog: gameLogCollection[i],
          }
        })

        const seasonIds = isAggregate
          ? this.props.selectedPlayers.map(playerTag =>
              yearStart.slice(0, 4).concat(yearEnd.slice(-4))
            )
          : this.props.selectedPlayers.map(playerTag => playerTag.split('-')[1])

        const sameSeason = isAggregate
          ? false
          : seasonIds.every(seasonId => seasonId === seasonIds[0])

        let startDate = ''
        let endDate = ''
        if (sameSeason) {
          let minDateArr = []
          let maxDateArr = []
          gameLogCollection.forEach(playerGameLogArr => {
            minDateArr.push(playerGameLogArr[0].date)
            maxDateArr.push(playerGameLogArr[playerGameLogArr.length - 1].date)
          })

          const presentDay = new Date()
          startDate = new Date(minDateArr.reduce((a, b) => (a < b ? a : b)))
          endDate = new Date(maxDateArr.reduce((a, b) => (a > b ? a : b)))

          endDate = endDate > presentDay ? presentDay : endDate
        }

        if (this._isMounted) {
          this.setState(
            {
              playerData,
              activeLines: selectedPlayers.slice(),
              statOptions,
              playerStat,
              seasonIds,
              sameSeason,
              startDate,
              endDate,
              minDate: startDate,
              maxDate: endDate,
            },
            () => {
              this.props.stopLoad()
            }
          )
        }
      })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  handleStatChange = e => {
    this.setState({ playerStat: e.target.value })
  }

  handleSwitchChange = name => event => {
    this.setState({ [name]: event.target.checked })
  }

  toggleLines = tag => {
    const newActiveLines = this.state.activeLines.slice()
    const tagIndex = newActiveLines.indexOf(tag)
    if (tagIndex === -1) {
      newActiveLines.push(tag)
    } else {
      newActiveLines.splice(tagIndex, 1)
    }
    this.setState({ activeLines: newActiveLines })
  }

  onChangeDate = name => event => {
    this.setState({ [name]: event })
  }

  render() {
    const {
      playerData,
      playerStat,
      summed,
      percentAvg,
      activeLines,
      hover,
      statOptions,
      startDate,
      endDate,
      seasonIds,
      sameSeason,
      minDate,
      maxDate,
    } = this.state

    if (!playerStat)
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <CircularProgress />
        </div>
      )

    const statObj = statOptions.find(obj => obj.key === playerStat)
    const statLabel = statObj.label

    const formatter = statObj.format ? statObj.format : x => (x ? x : 0)

    const selectedPlayerData = playerData.filter(obj =>
      activeLines.includes(obj.tag)
    )

    const statPercentage =
      playerStat.includes('Pct') || playerStat.includes('Percentage')

    const playerPointProgress = playerData.map(obj => {
      const { gameLog } = obj
      let total = 0
      let orderedGameLog = gameLog.slice()

      let startDateIso
      let endDateIso

      if (sameSeason) {
        startDateIso = startDate.toISOString().slice(0, 10)
        endDateIso = endDate.toISOString().slice(0, 10)
      }

      // Filter games based on date selection for sameSeason comparisons
      if (sameSeason) {
        orderedGameLog = orderedGameLog.filter(
          game => game.date > startDateIso && game.date < endDateIso
        )
      }

      if ((statPercentage && !percentAvg) || !summed) {
        return sameSeason
          ? orderedGameLog.map(game => {
              let x = Date.parse(game.date)
              return { x, y: formatter(game.stat[playerStat]) }
            })
          : orderedGameLog.map((game, i) => ({
              i,
              y: formatter(game.stat[playerStat]),
            }))
      } else {
        if (statPercentage && percentAvg) {
          return sameSeason
            ? orderedGameLog.map((game, i) => {
                total += formatter(game.stat[playerStat])
                let x = Date.parse(game.date)
                return { x, y: total / (i + 1) }
              })
            : orderedGameLog.map((game, i) => {
                total += formatter(game.stat[playerStat])
                return { i, y: total / (i + 1) }
              })
        } else {
          return sameSeason
            ? orderedGameLog.map((game, i) => {
                total += formatter(game.stat[playerStat])
                let x = Date.parse(game.date)
                return { x, y: total }
              })
            : orderedGameLog.map((game, i) => {
                total += formatter(game.stat[playerStat])
                return { i, y: total }
              })
        }
      }
    })

    const toi = statLabel.includes('TOI')

    const lineNames = selectedPlayerData.map(obj => `${obj.tag}-line-name`)

    const StatChartProps = {
      toi,
      sameSeason,
      lineNames,
      statLabel,
      playerData,
      activeLines,
      hover,
      dataSet: playerPointProgress,
    }

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        {playerData.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                height: '6.5rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginRight: '1rem',
                }}
              >
                <FormControl>
                  <InputLabel htmlFor="playerStat">Statistic</InputLabel>
                  <NativeSelect
                    value={playerStat}
                    onChange={this.handleStatChange}
                    input={<Input name="playerStat" id="playerStat" />}
                    style={{ marginRight: '1rem' }}
                  >
                    {statOptions.map(stat => (
                      <option value={stat.key} key={stat.key}>
                        {stat.label}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
                <DatePicker
                  autoOk
                  label="From"
                  disableFuture
                  value={startDate}
                  onChange={this.onChangeDate('startDate')}
                  animateYearScrolling={false}
                  minDate={minDate}
                  maxDate={endDate}
                  style={{
                    display: sameSeason ? 'flex' : 'none',
                    marginRight: '1rem',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                {statPercentage ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={percentAvg}
                        onChange={this.handleSwitchChange('percentAvg')}
                        disabled={!statPercentage}
                      />
                    }
                    label="Running Average"
                  />
                ) : (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={summed}
                        onChange={this.handleSwitchChange('summed')}
                        disabled={statPercentage}
                      />
                    }
                    label="Sum Results"
                  />
                )}
                <DatePicker
                  autoOk
                  label="To"
                  disableFuture
                  value={endDate}
                  onChange={this.onChangeDate('endDate')}
                  animateYearScrolling={false}
                  minDate={startDate}
                  maxDate={maxDate}
                  style={{ display: sameSeason ? 'flex' : 'none' }}
                />
              </div>
            </div>
            <Legend>
              {playerData.map((obj, i) => (
                <LegendItem
                  key={`${obj.tag}-legend`}
                  onClick={() => this.toggleLines(obj.tag)}
                  onMouseEnter={() => this.setState({ hover: obj.tag })}
                  onMouseLeave={() => this.setState({ hover: '' })}
                >
                  {activeLines.includes(obj.tag) ? (
                    <RadioButtonChecked
                      fontSize="inherit"
                      style={{
                        color: colorFunc(i / playerData.length),
                        marginRight: '0.3rem',
                      }}
                    />
                  ) : (
                    <RadioButtonUnchecked
                      fontSize="inherit"
                      style={{
                        color: colorFunc(i / playerData.length),
                        marginRight: '0.3rem',
                      }}
                    />
                  )}
                  {obj.tableData.playerName}{' '}
                  {!sameSeason ? yearFormat(seasonIds[i]) : ''}
                </LegendItem>
              ))}
            </Legend>
            <div style={{ height: '60vh' }}>
              <StatsChart {...StatChartProps} />
            </div>
          </>
        )}
      </div>
    )
  }
}

ChartComparison.propTypes = {
  selectedPlayers: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  stats: PropTypes.object.isRequired,
  startLoad: PropTypes.func.isRequired,
  stopLoad: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
  stats: state.stats,
  tableSettings: state.tableSettings,
})

export default connect(
  mapStateToProps,
  { startLoad, stopLoad }
)(ChartComparison)