const puppeteer = require('puppeteer-core');
const fs = require('fs');
const exec = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p=>fs.existsSync(p));
(async () => {
  const browser = await puppeteer.launch({ executablePath: exec, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  // 진단 → analyzing → results 흐름
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const id = 'mock-test-' + Date.now();
    sessionStorage.setItem('current_diagnosis', JSON.stringify({
      id, companyName:'디지털스마일치과', websiteUrl:'https://digitalsmile.tistory.com',
      industry:'dental', domain:'digitalsmile.tistory.com', startedAt: Date.now()
    }));
    // mock 결과 직접 주입 (analyzing 단계 건너뜀)
    sessionStorage.setItem('current_result_'+id, JSON.stringify({
      result: {
        success:true, id, companyName:'디지털스마일치과', websiteUrl:'https://digitalsmile.tistory.com',
        industry:'dental', analyzedAt:new Date().toISOString(), totalScore:42,
        grade:{key:'weak',label:'Weak'},
        scores: {
          visibility:{value:35,reason:''}, velocity:{value:42,reason:''},
          authority:{value:38,reason:''}, citation:{value:28,reason:''},
          engagement:{value:55,reason:''}, conversion:{value:32,reason:''},
          channel:{value:45,reason:''}, brand:{value:60,reason:''},
          competitive:{value:40,reason:''}, aio:{value:30,reason:''}
        },
        summary:{ headline:'테스트', diagnosis:'테스트', topProblems:['a','b','c'], opportunities:['x','y'], recommendation:'r', industryDetected:'dental' },
        competitors:[{label:'업계 평균',value:45},{label:'상위 10% 기업',value:78}],
        meta:{}
      },
      recommendation: { priorityActions:[
        {rank:1,kpiId:'citation',score:28,action:'a',detail:'d',impact:'i',cost:'c'},
        {rank:2,kpiId:'aio',score:30,action:'a',detail:'d',impact:'i',cost:'c'},
        {rank:3,kpiId:'conversion',score:32,action:'a',detail:'d',impact:'i',cost:'c'}
      ], packageTier:{name:'Test',price:'-',duration:'-',reason:'-',includes:[]},
      expectedOutcome:{timeframe:'3개월',improvement:'+200%',newScoreEstimate:67}, cta:{primaryUrl:'#'}}
    }));
    location.href = 'results.html?id=' + id;
  });
  await new Promise(r => setTimeout(r, 2500));

  const handle = await page.$('.radar-container');
  if (handle) {
    await handle.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await handle.screenshot({ path: 'radar-preview.png' });
    console.log('saved radar-preview.png');
  } else {
    console.log('no radar container');
  }
  await browser.close();
})();
