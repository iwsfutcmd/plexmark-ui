import React, { Component } from 'react';
import './App.css';
import { query, getTranslations} from './api';
import locale2 from 'locale2';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'material-ui-slider-label/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import AutoComplete from 'material-ui/AutoComplete';
import MenuItem from 'material-ui/MenuItem';
// import { List, ListItem } from 'material-ui/List';
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table';
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
        floatingLabelStyle={{transformOrigin: (this.props.direction === 'rtl') ? "right top 0px" : "left top 0px"}}
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
    var labelsToTranslate = ['lng', 'kmc', 'plu']
    this.state = {
      loading: false,
      uid: '',
      chaos: 6,
      fakeExprs: [],
      direction: 'ltr',
      interfaceLang: 'eng-000',
      labels: labelsToTranslate.reduce((obj, v) => {obj[v] = v; return obj;}, {}),
      sliding: false,
    }
    this.setLabels()
  }
  
  setLabels = () => {
    getTranslations(Object.keys(this.state.labels), 'art-000', this.state.interfaceLang)
    // .then((result) => {
    //   this.setState({labels: {'lng': result[0].txt}, interfaceLangvar: result[0].langvar})
    // });
    .then((result) => {
      let output = {};
      for (let txt of Object.keys(this.state.labels)) {
        output[txt] = result.filter(trn => (trn.trans_txt === txt))[0].txt
      };
      console.log(output);
      this.setState({labels: output, interfaceLangvar: result[0].langvar});
    });
  }
  
  getLabel = (label) => (this.state.labels[label]) ? this.state.labels[label] : label;
  
  handleSlider = (event, value) => {
    this.setState({chaos: value});
  }
  
  handleSelection = (index) => {
    var newFakeExprs = this.state.fakeExprs.slice();
    newFakeExprs[index].saved = !newFakeExprs[index].saved;
    this.setState({fakeExprs: newFakeExprs})
  }
  
  generate = (event) => {
    var savedFakeExprs = this.state.fakeExprs.filter((fakeExpr) => fakeExpr.saved)
    this.setState({loading: true})
    query('/fake_expr', {'uid': this.state.uid, 'state_size': 11 - this.state.chaos, 'count': 25})
    .then(
      (response) => {
        if (response.result)
          this.setState({ 
            fakeExprs: savedFakeExprs.concat(response.result.map((txt) => ({'txt': txt, 'saved': false}))),
            loading: false
          });
        else
          this.setState({ 
            fakeExprs: savedFakeExprs,
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
            {/* <RaisedButton 
              label="🔁" 
              onClick={() => this.setState({direction: (this.state.direction === 'rtl') ? 'ltr' : 'rtl'})}
            /> */}
            <UidInput
              onNewRequest={(item) => this.setState({ uid: item.text })}
              direction={this.state.direction}
              label={this.getLabel('lng')}
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
                      opacity: this.state.sliding ? 1 : 0,
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
                      <path d="m25 50 l -10 -10 a 15 15, 0, 1, 1, 20 0 Z" fill={muiTheme.palette.primary1Color}/>
                    </svg>
                    <div
                      className="slider-label-text"
                      style={{
                        transform: (this.state.direction === 'rtl') ? 'translate(50%, -500%)' : 'translate(-50%,  -500%)',
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
              label={(this.state.fakeExprs.length > 0) ? this.getLabel('plu') : this.getLabel('kmc')}
              onClick={this.generate}
            />
            <div className="result">
              {(this.state.loading) ?
                <div><CircularProgress/></div> :
                <Table 
                  multiSelectable={true}
                  onCellClick={(rowNumber) => this.handleSelection(rowNumber)}
                >
                  <TableBody displayRowCheckbox={true}>
                    {this.state.fakeExprs.map( (fakeExpr, index) =>
                      <TableRow
                        className="fake-expr-row"
                        key={index}
                        selected={fakeExpr.saved}
                        style={{height: '40px'}}
                      >
                        <TableRowColumn 
                          style={{fontSize: '16px', height: '40px'}}
                        >
                          {fakeExpr.txt}
                        </TableRowColumn>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              }
            </div>
              {/* {(this.state.loading) ? 
                <div className="loading-icon"><CircularProgress/></div> :
                <List>
                {this.state.fakeExprs.map( (fakeExpr, index) =>
              <ListItem
              primaryText={fakeExpr.txt}
              key={index}
              innerDivStyle={{padding: 8}}
              onClick={() => this.moveToTop(fakeExpr, index)}
              />
                )}
              </List>
            } */}
          </div>
        </MuiThemeProvider>
        {/* {locale2} */}
      </div>
    );
  }
}

export default App;
