import React, { Component } from 'react';
import './App.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'material-ui-slider-label/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import Subheader from 'material-ui/Subheader';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

const panlexRed = '#A60A0A'

const VERSION = 2
const APISERVER = 'https://api.panlex.org'
// const MAXRESULT = 2000
// const MAXOFFSET = 250000
const URLBASE = (VERSION === 2) ? APISERVER + '/v2' : APISERVER

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: panlexRed,
  }
})

export function query(ep, params) {
  let url = URLBASE + ep
  return(fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  .then((response) => response.json()));
}

class UidInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      suggestions: [],
    }
  }
  
  getSuggestions = (txt) => {
    query('/suggest/langvar', {'txt': txt, 'pref_trans_langvar': 187})
    .then((response) => {
      if (response.suggest) {
        var suggestions = response.suggest.map((s) => {
          var nameString = s.trans.map(trans => trans.txt).join(' / ');
          return {
            text: s.uid, 
            // value: <UidItem item={s}/>,
            value: <MenuItem primaryText={nameString} secondaryText={s.uid}/>,
            item: s,
          }});
        this.setState({ suggestions });
      } else {
        this.setState({ suggestions: []});
      }
    });
  }
  
  render() {
    return (
      <AutoComplete
        floatingLabelText="Language"
        searchText={this.state.searchText}
        filter={AutoComplete.noFilter}
        dataSource={this.state.suggestions}
        onUpdateInput={this.getSuggestions}
        onNewRequest={(suggestion) => {
          this.setState({searchText: suggestion.item.trans[0].txt});
          this.props.onNewRequest(suggestion);
        }}
        fullWidth={true}
      />
    )
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: '',
      chaos: 6,
      fakeExprs: [],
      result: '',
    }
  }
  
  handleSlider = (event, value) => {
    this.setState({chaos: value});
  }
  
  handleFocus = (event) => {
    event.target.select();
  }
  
  generate = (event) => {
    query('/fake_expr', {'uid': this.state.uid, 'state_size': 11 - this.state.chaos, 'count': 25})
    .then(
      (response) => {
        if (response.result)
          this.setState({ fakeExprs: response.result});
        else
          this.setState({ fakeExprs: []});
      }
    )
  }
  
  render() {
    return (
      <div className="App">
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
            <UidInput 
              onNewRequest={(item) => this.setState({ uid: item.text })}
            />
            <Subheader>Chaos</Subheader>
            <Slider
              step={1}
              min={1}
              max={10}
              value={this.state.chaos}
              onChange={this.handleSlider}
              label={
                <div style={{position: 'relative', top: '16px'}}>
                  {this.state.chaos}
                </div>
              }
            />
            <RaisedButton
              style={{marginBottom: 16}}
              label="Generate!"
              onTouchTap={this.generate}
            />
          </div>
        </MuiThemeProvider>
        {this.state.fakeExprs.map( (fakeExpr, index) => (
          <div key={index}>{fakeExpr}</div>
        ))}
      </div>
    );
  }
}

export default App;
