import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  Table,
  TableHead,
  Checkbox,
  IconButton,
  TableBody,
  TableRow,
} from '@material-ui/core'
import { Star, StarBorder, TableChart } from '@material-ui/icons'
import { amber, grey } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'
import {
  yearFormatter,
  stopPropagation,
  generateCols,
} from '../../helper/columnLabels'
import Tooltip from '@material-ui/core/Tooltip'
import {
  TableCellStyled as TableCell,
  TableSortLabelStyled as TableSortLabel,
} from '../styles/TableStyles'
import { openPlayerModal } from '../../actions/statActions'

const styles = {
  root: {
    color: grey[500],
    '&$checked': {
      color: amber[600],
    },
    padding: 0,
    transform: 'scale(0.8)',
  },
  checked: {},
}

const TableData = props => {
  const {
    dataDisplay,
    page,
    rowsPerPage,
    selectedPlayers,
    handleRowClick,
    updateTrackedPlayers,
    classes,
    handleRequestSort,
    openPlayerModal,
    handleStarClick,
    playerData,
  } = props

  const aggregateTable = !(dataDisplay[0]
    ? Object.keys(dataDisplay[0]).includes('seasonId')
    : false)

  const columns = generateCols(dataDisplay)
  const { sortObj } = playerData
  const sortArray = Object.keys(sortObj)

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow style={{ borderColor: 'none', height: '35px' }}>
            <TableCell
              style={{
                background: '#6d6d6d',
              }}
            />
            <TableCell
              component="th"
              style={{
                paddingLeft: '24px',
                color: 'white',
                fontWeight: 'bolder',
                letterSpacing: '1px',
                background: '#6d6d6d',
              }}
            >
              Name
            </TableCell>
            {columns.map(col => (
              <TableCell
                align="center"
                key={col.id}
                style={{
                  color: 'white',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bolder',
                  letterSpacing: '1px',
                  background: '#6d6d6d',
                }}
                sortDirection={
                  sortObj[col.id] ? sortObj[col.id].toLowerCase() : false
                }
              >
                <Tooltip
                  title={col.id}
                  placement={'bottom-end'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={['DESC', 'ASC'].includes(sortObj[col.id])}
                    direction={
                      (sortObj[col.id] && sortObj[col.id].toLowerCase()) ||
                      'desc'
                    }
                    id={col.id}
                    onClick={handleRequestSort}
                    style={{
                      color: 'white',
                    }}
                    hideSortIcon={true}
                  >
                    {col.title}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {dataDisplay.map((row, i) => (
            <TableRow
              key={`${row.playerId}-${row.seasonId}`}
              style={{ height: 'auto' }}
              hover={true}
              selected={
                selectedPlayers.includes(
                  [row.playerId, row.seasonId, row.teamAbbrevs].join('-')
                ) || selectedPlayers.includes(row.playerId.toString())
              }
              playerid={row.playerId}
              seasonid={row.seasonId}
              teams={row.teamAbbrevs}
              onClick={handleRowClick}
            >
              <TableCell
                style={{
                  padding: '0 5px',
                  margin: '0',
                }}
              >
                {i + 1 + page * rowsPerPage}
              </TableCell>
              <TableCell
                component="th"
                style={{
                  paddingLeft: '24px',
                  whiteSpace: 'nowrap',
                }}
              >
                {row['playerName']}
              </TableCell>
              {!aggregateTable && (
                <>
                  <TableCell
                    style={{
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {yearFormatter(row['seasonId'])}
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      icon={<StarBorder />}
                      checkedIcon={<Star />}
                      checked={handleStarClick(row.playerId, row.seasonId)}
                      inputProps={{
                        playerid: row.playerId,
                        seasonid: row.seasonId,
                      }}
                      onChange={updateTrackedPlayers}
                      onClick={stopPropagation}
                      style={{ textAlign: 'center' }}
                      classes={{
                        root: classes.root,
                        checked: classes.checked,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      children={<TableChart />}
                      classes={{ root: classes.root }}
                      onClick={event => {
                        event.stopPropagation()
                        openPlayerModal('gameLogModal', row)
                      }}
                    />
                  </TableCell>
                </>
              )}
              {columns
                .filter(
                  obj => !['seasonId', 'track', 'gameLogs'].includes(obj.id)
                )
                .map(col => (
                  <TableCell
                    key={`${row.playerId}-${col.id}`}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '3px 12px',
                      background: sortArray.includes(col.id)
                        ? `rgba(63, 81, 181, ${0.5 -
                            0.1 * sortArray.indexOf(col.id)})`
                        : '',
                    }}
                    align="center"
                  >
                    {col.format && row[col.id]
                      ? col.format(row[col.id])
                      : row[col.id]}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

TableData.propTypes = {
  dataDisplay: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  selectedPlayers: PropTypes.array.isRequired,
  playerData: PropTypes.object.isRequired,
  handleRowClick: PropTypes.func.isRequired,
  updateTrackedPlayers: PropTypes.func.isRequired,
  handleRequestSort: PropTypes.func.isRequired,
  openPlayerModal: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
  playerData: state.playerData,
})

export default withStyles(styles)(
  connect(
    mapStateToProps,
    { openPlayerModal }
  )(TableData)
)
