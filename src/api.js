const VERSION = 2
const APISERVER = 'https://api.panlex.org'
const URLBASE = (VERSION === 2) ? APISERVER + '/v2' : APISERVER

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

export function getTranslations(txt, uidDe, uidAl) {
  return(query('/expr', {
    trans_uid: uidDe,
    uid: uidAl,
    trans_txt: txt,
    include: 'trans_quality',
    sort: 'trans_quality desc',
  }).then(responseData => responseData.result))
}
