import React, { Component } from 'react';

import locale2 from 'locale2';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'material-ui-slider-label/Slider';
import RaisedButton from 'material-ui/RaisedButton';
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table';
import CircularProgress from 'material-ui/CircularProgress';
import injectTapEventPlugin from 'react-tap-event-plugin';

import './App.css';
import { query, getTranslations } from './api';
import UidInput from './UidInput';

const panlexRed = '#A60A0A';
injectTapEventPlugin();

class App extends Component {
  constructor(props) {
    super(props);
    const muiTheme = getMuiTheme({
      palette: {
        primary1Color: panlexRed,
      }
    })

    let labelsToTranslate = ['lng', 'kmc', 'plu']
    this.state = {
      muiTheme,
      loading: false,
      uid: '',
      chaos: 6,
      fakeExprs: [],
      direction: 'ltr',
      interfaceLangvar: 'eng-000',
      labels: labelsToTranslate.reduce((obj, v) => {obj[v] = v; return obj;}, {}),
      sliding: false,
    }
    this.setLabels()
  }
  
  setLabels = () => {
    getTranslations(Object.keys(this.state.labels), 'art-000', this.state.interfaceLang)
    .then((result) => {
      let output = {};
      for (let txt of Object.keys(this.state.labels)) {
        output[txt] = result.filter(trn => (trn.trans_txt === txt))[0].txt
      };
      this.setState({labels: output, interfaceLangvar: result[0].langvar});
    });
  }
  
  getLabel = (label) => (this.state.labels[label]) ? this.state.labels[label] : label;
  
  handleSlider = (event, value) => {
    this.setState({chaos: value});
  }
  
  handleSelection = (index) => {
    let newFakeExprs = this.state.fakeExprs.slice();
    newFakeExprs[index].saved = !newFakeExprs[index].saved;
    this.setState({fakeExprs: newFakeExprs})
  }
  
  generate = (event) => {
    let savedFakeExprs = this.state.fakeExprs.filter((fakeExpr) => fakeExpr.saved)
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
    let dirStyles = {};
    if (this.state.direction === 'rtl') {
      this.state.muiTheme.isRtl = true;
      dirStyles['slider-icon'] = {transform: 'scaleX(-1)'};
      dirStyles['slider-label-box'] = {transform: 'translate(-50%)'};
      dirStyles['slider-svg'] = {transform: 'translate(50%, -110%)'};
      dirStyles['slider-label-text'] = {transform: 'translate(50%, -500%)'};
    } else {
      this.state.muiTheme.isRtl = false;
      dirStyles['slider-icon'] = {transform: 'scaleX(1)'};
      dirStyles['slider-label-box'] = {transform: 'translate(50%)'};
      dirStyles['slider-svg'] = {transform: 'translate(-50%, -110%)'};
      dirStyles['slider-label-text'] = {transform: 'translate(-50%, -500%)'};
    }
    let slidingStyleTransform = ' ' + (this.state.sliding ? 'scale(1)' : 'scale(0)');
    dirStyles['slider-svg'].transform += slidingStyleTransform;
    dirStyles['slider-label-text'].transform += slidingStyleTransform;
        
    return (
      <div className="App" style={{direction: this.state.direction}}>
        <MuiThemeProvider muiTheme={this.state.muiTheme}>
          <div>
            <RaisedButton 
              label="🔁" 
              onClick={() => this.setState({direction: (this.state.direction === 'rtl') ? 'ltr' : 'rtl'})}
            />
            <UidInput
              onNewRequest={(item) => this.setState({ uid: item.text })}
              direction={this.state.direction}
              label={this.getLabel('lng')}
              interfaceLangvar={this.state.interfaceLangvar}
            />
            <div className="slider-box">
              <span className="slider-icon chaos-low" style={dirStyles['slider-icon']}>🗨</span>
              <Slider
                className="slider"
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
                    style={dirStyles['slider-label-box']}
                  >
                    <svg 
                      className="slider-svg" 
                      width={50} 
                      height={50}
                      style={dirStyles['slider-svg']}
                    >
                      <path d="m25 50 l -10 -10 a 15 15, 0, 1, 1, 20 0 Z" fill={this.state.muiTheme.palette.primary1Color}/>
                    </svg>
                    <div
                      className="slider-label-text"
                      style={dirStyles['slider-label-text']}
                    >
                      {this.state.chaos}
                    </div>
                  </div>
                }
              />
              <span className="slider-icon chaos-high" style={dirStyles['slider-icon']}>🗯</span>
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
          </div>
        </MuiThemeProvider>
        {/* {locale2} */}
      </div>
    );
  }
}

export default App;
