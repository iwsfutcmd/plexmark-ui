import React, { Component } from 'react';
import './App.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'material-ui-slider-label/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
// import Subheader from 'material-ui/Subheader';
import CircularProgress from 'material-ui/CircularProgress';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { query, getTranslations } from './api';
import locale2 from 'locale2';

injectTapEventPlugin();

const panlexRed = '#A60A0A'

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: panlexRed,
  }
})

class UidInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      suggestions: [],
    }
  }
  
  getSuggestions = (txt) => {
    query('/suggest/langvar', {'txt': txt, 'pref_trans_langvar': this.props.interfaceLangvar})
    .then((response) => {
      if (response.suggest) {
        var suggestions = response.suggest.map((s) => {
          var altNameString = s.trans.slice(1).map(tran => tran.txt).join(' — ');
          return {
            text: s.uid, 
            value: (
              <MenuItem>
                <div className='uid-item' style={{direction: this.props.direction}}>
                  <div className='uid-line uid-main'>
                    <span>{s.trans[0].txt}</span>
                    <span>{s.uid}</span>
                  </div>
                  <div className='uid-line uid-alt'>
                    {altNameString}
                  </div>
                </div>
              </MenuItem>
            ),
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
        floatingLabelText={this.props.label}
        searchText={this.state.searchText}
        filter={AutoComplete.noFilter}
        dataSource={this.state.suggestions}
        onUpdateInput={this.getSuggestions}
        onNewRequest={(suggestion) => {
          this.setState({searchText: suggestion.item.trans[0].txt});
          this.props.onNewRequest(suggestion);
        }}
        fullWidth={true}
        menuProps={{maxHeight: '24ex'}}
      />
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      uid: '',
      chaos: 6,
      fakeExprs: [],
      result: '',
      direction: 'ltr',
      interfaceLang: 'eng-000',
      interfaceLangvar: 187,
      label: 'lng'
    }
    this.setLabel()
  }
  
  setLabel = () => {
    getTranslations('lng', 'art-000', this.state.interfaceLang)
    .then((result) => this.setState({label: result[0].txt}))
  }
  
  handleSlider = (event, value) => {
    this.setState({chaos: value});
  }
  
  handleFocus = (event) => {
    event.target.select();
  }
  
  generate = (event) => {
    this.setState({loading: true})
    query('/fake_expr', {'uid': this.state.uid, 'state_size': 11 - this.state.chaos, 'count': 25})
    .then(
      (response) => {
        if (response.result)
          this.setState({ 
            fakeExprs: response.result,
            loading: false
          });
        else
          this.setState({ 
            fakeExprs: [],
            loading: false
          });
      }
    )
  }
  
  render() {
    return (
      <div className="App" style={{direction: this.state.direction}}>
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
            <UidInput
              onNewRequest={(item) => this.setState({ uid: item.text })}
              direction={this.state.direction}
              label={this.state.label}
              interfaceLangvar={this.state.interfaceLangvar}
            />
            <span>Chaos</span>
            <Slider
              axis={(this.state.direction === 'ltr') ? 'x' : 'x-reverse'}
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
            {(this.state.loading) ? 
              <div><CircularProgress/></div> :
              this.state.fakeExprs.map( (fakeExpr, index) => (
                <div key={index}>{fakeExpr}</div>
              ))
            }
          </div>
        </MuiThemeProvider>
        {/* {locale2} */}
      </div>
    );
  }
}

export default App;
