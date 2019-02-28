import React from 'react'
import {
  FormControl,
  FormControlLabel,
  InputLabel,
  Input,
  NativeSelect,
  Button,
  Switch,
} from '@material-ui/core'

const StatsFilterPanel = props => {
  const {
    isAggregate,
    yearStart,
    yearEnd,
    playerPositionCode,
    handleRowFilter,
    handleSwitchChange,
    handleSeasonChange,
    submitQuery,
    selectedPlayers,
    handleModalOpen,
  } = props

  const yearCutoff = parseInt(yearStart.slice(0, 4), 10)
  let optionsStart = []
  let optionsEnd = []

  for (let i = 1917; i < 2019; i++) {
    optionsStart.push(
      <option value={`${i}${i + 1}`} key={`${i}-start`}>{`${i}-${i +
        1}`}</option>
    )
  }

  for (let i = yearCutoff; i < 2019; i++) {
    optionsEnd.push(
      <option value={`${i}${i + 1}`} key={`${i}-end`}>{`${i}-${i + 1}`}</option>
    )
  }

  return (
    <div style={{ margin: '2rem 0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <span
          style={{
            paddingRight: '1rem',
            fontWeight: 'bolder',
            height: '100%',
          }}
        >
          Season Range
        </span>
        <FormControl>
          <InputLabel htmlFor="yearStart" />
          <NativeSelect
            value={yearStart}
            onChange={handleSeasonChange('yearStart')}
            input={<Input name="yearStart" id="yearStart" />}
          >
            {optionsStart.map(option => option)}
          </NativeSelect>
        </FormControl>
        <span style={{ padding: '0 1rem' }}> to </span>
        <FormControl>
          <InputLabel htmlFor="yearEnd" />
          <NativeSelect
            value={yearEnd}
            onChange={handleSeasonChange('yearEnd')}
            input={<Input name="yearEnd" id="yearEnd" />}
          >
            {optionsEnd.map(option => option)}
          </NativeSelect>
        </FormControl>
      </div>
      <FormControlLabel
        control={
          <Switch
            checked={isAggregate}
            onChange={handleSwitchChange('isAggregate')}
          />
        }
        label="Sum Results"
      />
      <div>
        <FormControl>
          <InputLabel htmlFor="playerPositionCode">Position</InputLabel>
          <NativeSelect
            value={playerPositionCode}
            onChange={handleRowFilter('playerPositionCode')}
            input={<Input name="playerPositionCode" id="playerPositionCode" />}
          >
            <option value={'LRCD'}>All Skaters</option>
            <option value={'LRC'}>Forwards</option>
            <option value={'L'}>Left Wing</option>
            <option value={'R'}>Right Wing</option>
            <option value={'C'}>Center</option>
            <option value={'D'}>Defensemen</option>
          </NativeSelect>
        </FormControl>
      </div>
      <div
        style={{
          marginTop: '1rem',
        }}
      >
        <Button color="primary" variant="contained" onClick={submitQuery}>
          generate data
        </Button>
        {selectedPlayers.length !== 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleModalOpen}
            style={{
              fontWeight: 'bolder',
              marginLeft: '1rem',
            }}
          >
            compare selected
          </Button>
        )}
      </div>
    </div>
  )
}

export default StatsFilterPanel
