import React, { Component } from 'react';
import './App.css';
import { query, getTranslations } from './api';
import locale2 from 'locale2';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'material-ui-slider-label/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
import { List, ListItem } from 'material-ui/List';
import CircularProgress from 'material-ui/CircularProgress';
import injectTapEventPlugin from 'react-tap-event-plugin';
const panlexRed = '#A60A0A';
injectTapEventPlugin();
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
            langName: s.trans[0].txt,
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
          this.setState({searchText: suggestion.langName});
          this.props.onNewRequest(suggestion);
        }}
        fullWidth={true}
        menuProps={{maxHeight: 240}}
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
      label: 'lng',
      sliding: false,
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
    var flip = (this.state.direction === 'rtl') ? 'scaleX(-1)' : 'scaleX(1)';
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
            <div className="slider-box">
              <span className="slider-icon chaos-low" style={{transform: flip}}>🗨</span>
              <Slider
                className="slider"
                axis={(this.state.direction === 'rtl') ? 'x-reverse' : 'x'}
                step={1}
                min={1}
                max={10}
                value={this.state.chaos}
                onChange={this.handleSlider}
                onDragStart={() => this.setState({sliding: true})}
                onDragStop={() => this.setState({sliding: false})}
                label={
                  <div 
                    className="slider-label-box"
                    style={{
                      visibility: this.state.sliding ? 'visible' : 'hidden',
                      transform: (this.state.direction === 'rtl') ? 'translate(-50%)' : 'translate(50%)',
                    }}
                  >
                    <svg 
                      className="slider-svg" 
                      width={50} 
                      height={50}
                      style={{
                        transform: (this.state.direction === 'rtl') ? 'translate(50%, -110%)' : 'translate(-50%,  -110%)',
                      }}
                    >
                      <path d="m25 50 l -10 -10 a 15 15, 0, 1, 1, 20 0 Z" fill={panlexRed}/>
                    </svg>
                    <div
                      className="slider-label-text"
                      style={{
                        transform: (this.state.direction === 'rtl') ? 'translate(50%, -425%)' : 'translate(-50%,  -425%)',
                      }}
                    >
                      {this.state.chaos}
                    </div>
                  </div>
                }
              />
              <span className="slider-icon chaos-high" style={{transform: flip}}>🗯</span>
            </div>
            <RaisedButton
              label="Generate!"
              onTouchTap={this.generate}
            />
            {(this.state.loading) ? 
              <div><CircularProgress/></div> :
              <List>
                {this.state.fakeExprs.map( (fakeExpr, index) =>
                  <ListItem 
                    primaryText={fakeExpr} 
                    key={index}
                    innerDivStyle={{padding: 8}}
                  />
                )}
              </List>
            }
          </div>
        </MuiThemeProvider>
        {/* {locale2} */}
      </div>
    );
  }
}

export default App;
