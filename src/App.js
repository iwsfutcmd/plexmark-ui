import React, { Component } from 'react';

import '@material/button/dist/mdc.button.min.css';
import '@material/card/dist/mdc.card.min.css';
import '@material/typography/dist/mdc.typography.min.css';
import '@material/toolbar/dist/mdc.toolbar.min.css';
import '@material/ripple/dist/mdc.ripple.min.css';
import '@material/slider/dist/mdc.slider.min.css';
import {MDCSlider} from '@material/slider/dist/mdc.slider.min';
import '@material/list/dist/mdc.list.min.css';
import "@material/form-field/dist/mdc.form-field.min.css";
import "@material/checkbox/dist/mdc.checkbox.min.css";

import '@material/textfield/dist/mdc.textfield.min.css';
import {MDCTextField} from '@material/textfield/dist/mdc.textfield.min';


import shuffle from 'lodash/shuffle';
// import countBy from 'lodash/countBy';
// import orderBy from 'lodash/orderBy';

import './App.css';
import { query, getMultTranslations, getAllTranslations } from './api';
import LvInfo from './LvInfo';
import LvChips from './LvChips';
import LvInput from './LvInput';
import PanLexAppBar from './PanLexAppBar';
import './material.css';
import LoadingIcon from './LoadingIcon';


const compactWidth = 840

const DEBUG = false;

const initialUids = [
  
];
const initialInterfaceUid = "eng-000";
class App extends Component {
  constructor(props) {
    super(props);
    let labelsToTranslate = [
      'PanLex', 'lng', 'tra', 'al', 'de', 'txt', 'mod', 'npo', 'don', 'plu',
      'trn', 'viz', 'nom', 'kar', 'loc', 'del', 'nno', 'epr', 'zxx', 'kmc'
    ]
    
    this.state = {
      compact: window.innerWidth <= compactWidth,
      lvCache: new Map(),
      loading: false,
      direction: 'ltr',
      lang: {},
      langs: [],
      trnTrn: 0,
      interfaceLangDialogOpen: false,
      labels: labelsToTranslate.reduce((obj, v) => {obj[v] = v; return obj;}, {}),
      chaos: 6,
      fakeExprs: [],
      kmc: "",
      re: "",
    }
  }

  componentWillMount() {
    window.addEventListener('resize', () => this.setState({compact: window.innerWidth <= compactWidth}));
  }

  componentDidMount() {
    this.cacheLvs().then(() => this.getInitialLangs(initialUids));
    this.chaosSlider = new MDCSlider(document.querySelector('.mdc-slider'));
    this.chaosSlider.listen('MDCSlider:change', () => this.setState({chaos: this.chaosSlider.value}));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => this.setState({windowWidth: window.innerWidth}));
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.interfaceLangvar !== this.state.interfaceLangvar) {
      this.setLabels();
      this.getOtherNames();
      this.cacheKar();
      this.cacheLoc();
    }
    if (prevState.lang.id && (prevState.lang.id !== this.state.lang.id)) {
      localStorage.setItem("lang", this.state.lang.id);
      this.setState(
        {langs: [...new Set([prevState.lang, ...prevState.langs])]},
        () => this.getOtherNames()
      )
    }
  }

  cacheLvs = () => (
    query('/langvar', {limit: 0, exclude: [
      'grp', 
      'lang_code', 
      'mutable', 
      'name_expr',
      'name_expr_txt_degr',
      'var_code',
     ]}).then(
      r => {
        let lvCache = new Map();
        r.result.forEach(lv => {lvCache.set(lv.id, lv)});
        this.setState({lvCache});
      })
  )
  
  cacheKar = () => (
    getAllTranslations('art-262', this.state.interfaceLangvar, true).then(
      karCache => {
        let lvCache = this.state.lvCache;
        lvCache.forEach(lv => {
          lv.scriptNames = karCache[lv.script_expr].map(r => r.txt);
        })
        this.setState({lvCache});
      }
    )
  )

  cacheLoc = () => {
    let locExprs = [];
    this.state.lvCache.forEach(v => locExprs.push(v.region_expr));
    getMultTranslations(locExprs, '', this.state.interfaceLangvar).then(
      locCache => {
        let lvCache = this.state.lvCache;
        lvCache.forEach(lv => {
          lv.regionNames = locCache[lv.region_expr].map(r => r.txt);
        })
        this.setState({lvCache});
      }
    )
  }

  fromLvCache = (lvId) => (this.state.lvCache.get(lvId) || {})

  getInitialLangs = (initialUids) => {
    let initialUidsSet = new Set(initialUids);
    let langs = [];
    let interfaceLv;
    this.state.lvCache.forEach((lv, lvId) => {
      if (initialUidsSet.has(lv.uid)) {
        langs.push(lv);
      }
      if (lv.uid === initialInterfaceUid) {
        interfaceLv = lv;
      }
    })
    this.setState({
      lang: this.state.lvCache.get(Number(localStorage.getItem("lang"))) || interfaceLv,
      langs: shuffle(langs),
      interfaceLangvar: interfaceLv.id
    });
  }

  setLabels = () => {
    getMultTranslations(Object.keys(this.state.labels), 'art-000', this.state.interfaceLangvar).then(
      result => {
        let labels = Object.keys(this.state.labels).reduce((obj, label) => {
          if (result[label][0]) {
            obj[label] = result[label][0].txt;
          } else {
            obj[label] = "";
          }
          return(obj)
        }, {})
        this.setState({labels})
      }
    )
  }

  getLabel = (label) => (this.state.labels[label]) ? this.state.labels[label] : label;

  getOtherNames = () => {
    let langs = [this.state.lang, ...this.state.langs]
    getMultTranslations(langs.map(lv => lv.uid), 'art-274', this.state.interfaceLangvar)
      .then(result => {
        let lvCache = this.state.lvCache;
        langs.forEach(lv => {
          let lang = lvCache.get(lv.id);
          lang.otherNames = result[lang.uid].map(r => r.txt);
          lvCache.set(lv, lang);

        })
        this.setState(lvCache);
      })
  }

  generate = event => {
    let savedFakeExprs = this.state.fakeExprs.filter((fakeExpr) => fakeExpr.saved)
    this.setState({loading: true})
    query('/fake_expr', {
      'uid': this.state.lang.uid, 
      'state_size': 11 - this.state.chaos, 
      'count': 25, 
      'init_state': this.state.kmc,
      'skip_re': this.state.re,
    })
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

//   handleTouchLvChip = (event, lv) => {
//     [].forEach.call(document.getElementsByClassName("droppable"), e => {
//       e.classList.add("drop-highlight");
//     });
//     this.setState({touchedLv: lv});
//   }

//   handleTouchLang = event => {
//     console.log(event);
//     [].forEach.call(document.getElementsByClassName("droppable"), e => {
//       e.classList.remove("drop-highlight");
//     });
//     let lang = this.state.lvCache.get(this.state.touchedLv);
//     this.setState({lang, touchedLv: undefined});
//   }

  render() {
    return (
      <div className="mdc-typography App" dir={this.state.direction}>
        <div>
          <PanLexAppBar 
            panlexLabel={this.getLabel('PanLex')}
            title={[this.getLabel('PanLex'), this.getLabel('epr'), this.getLabel('zxx')].join(' — ')}
            lngModLabel={[this.getLabel('lng'), this.getLabel('mod')].join(' — ')}
            donLabel={this.getLabel('don')}
            switchDirection={() => this.setState({direction: (this.state.direction === 'rtl') ? 'ltr' : 'rtl'})}
            setInterfaceLangvar={langvar => {
              this.setState({ 
                interfaceLangvar: langvar,
              });
            }}
            interfaceLangvar={this.state.interfaceLangvar}
            trnLabel={this.getLabel('trn')}
            trnTrnLabel={[this.getLabel('trn'), this.getLabel('trn')].join(' — ')}
            handleTrnTrn={() => this.setState({trnTrn: (this.state.trnTrn + 1) % 3})}
            trnTrn={this.state.trnTrn}
            debug={DEBUG}
          />
          <main className="mdc-toolbar-fixed-adjust main-area">
            {/* <div className="trn"> */}
              {/* <div className="trn-box"> */}
                <div
                  onDrop={event => {
                    event.preventDefault();
                    let lang = this.state.lvCache.get(parseInt(event.dataTransfer.getData("text"), 10));
                    if (lang) {this.setState({lang})}
                  }}
                  onDragOver={event => {event.preventDefault()}}
                >
                  <div className="uid-box">
                    <div className="txt-inputs">
                      <LvInput
                        label={this.getLabel('lng')}
                        interfaceLangvar={this.state.interfaceLangvar}                        
                        onNewRequest={lv => {
                          let lang = this.state.lvCache.get(lv);
                          this.setState({lang});
                        }}
                      />
                      <div 
                        ref={div => {if (div) {this.kmcInput = new MDCTextField(div)}}}
                        className="input-box mdc-text-field mdc-text-field--upgraded"
                      >
                        <input 
                          id="kmc-input"
                          className="mdc-text-field__input"
                          type="text"
                          value={this.state.kmc}
                          onChange={e => this.setState({kmc: e.target.value})}
                          autoCapitalize="none"
                        />
                        <label className="mdc-text-field__label" htmlFor="kmc-input">{this.props.label}</label>
                        <div className="mdc-line-ripple"/>
                      </div>
                      <div 
                        ref={div => {if (div) {this.reInput = new MDCTextField(div)}}}
                        className="input-box mdc-text-field mdc-text-field--upgraded"
                      >
                        <input 
                          id="re-input"
                          className="mdc-text-field__input"
                          type="text"
                          value={this.state.re}
                          onChange={e => this.setState({re: e.target.value})}
                          autoCapitalize="none"
                        />
                        <label className="mdc-text-field__label" htmlFor="re-input">{this.props.label}</label>
                        <div className="mdc-line-ripple"/>
                      </div>
                    </div>
                    <LvInfo 
                      nomLabel={this.getLabel('nom') + " — " + this.fromLvCache(this.state.interfaceLangvar).name_expr_txt + ":"}
                      karLabel={this.getLabel('kar') + ":"}
                      locLabel={this.getLabel('loc') + ":"}
                      lang={this.state.lang}
                    //   onTouchStart={this.state.touchedLv && this.handleTouchLang}
                    />
                  </div>

                </div>
                <LvChips
                  langList={this.state.langs}
                  onTouchStart={this.handleTouchLvChip}
                />
                <div className="mdc-slider mdc-slider--discrete" tabIndex="0" role="slider"
                     aria-valuemin="1" aria-valuemax="10" aria-valuenow="6" aria-label="Select Value">
                  <div className="mdc-slider__track-container chaos-bg">
                    <div className="mdc-slider__track chaos"/>
                  </div>
                  <div className="mdc-slider__thumb-container">
                    <div className="mdc-slider__pin chaos chaos-pin">
                      <span className="mdc-slider__pin-value-marker"/>
                    </div>
                    <svg className="mdc-slider__thumb chaos-thumb" width="21" height="21">
                      <circle cx="10.5" cy="10.5" r="7.875"/>
                    </svg>
                    <div className="mdc-slider__focus-ring chaos"/>
                  </div>
                </div>
                <button className="kmc-button mdc-button mdc-button--raised" onClick={this.generate}>
                  {(this.state.fakeExprs.length > 0) ? this.getLabel('plu') : this.getLabel('kmc')}                
                </button>
                {this.state.loading ? <div className="loading-icon"><LoadingIcon size="48"/></div> :
                  <ul className="mdc-list">
                  {this.state.fakeExprs.map((expr, index) => (
                    <li 
                      className="mdc-list-item" 
                      key={index}
                      onClick={() => {
                        let fakeExprs = this.state.fakeExprs;
                        fakeExprs[index].saved = !this.state.fakeExprs[index].saved;
                        this.setState({fakeExprs});
                      }}
                    >
                      <div className="mdc-form-field">
                        <div className="mdc-checkbox">
                          <input type="checkbox"
                                className="mdc-checkbox__native-control"
                                id={"checkbox-" + index}
                                checked={this.state.fakeExprs[index].saved}
                                onChange={e => e.preventDefault()}
                          />
                          <div className="mdc-checkbox__background">
                            <svg className="mdc-checkbox__checkmark"
                                viewBox="0 0 24 24">
                              <path className="mdc-checkbox__checkmark-path"
                                    fill="none"
                                    d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                            </svg>
                            <div className="mdc-checkbox__mixedmark"></div>
                          </div>
                        </div>
                        <label htmlFor={"checkbox-" + index}>{expr.txt}</label>
                      </div>
                    </li>
                  ))}
                  </ul>
                }
              {/* </div> */}
            {/* </div> */}
          </main>
        </div>
      </div>
    );
  }
}

export default App;
