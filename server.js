// express
const express = require("express")
app = express()
// axios
const axios = require("axios")
// => 현재 주식정보를 axios를 통해 웹스크래핑
// cheerio
const cheerio = require("cheerio")
// nightmare
const Nightmare = require("nightmare")
// => 주간 주식 정보 웹스크래핑
const nightmare = Nightmare({
    show:false
})
// cors
const cors = require("cors")
app.use(cors())
// vo
const vo = require("vo")

const PORT = 12010;

const DAY_BASE_URL
= 'https://finance.naver.com/item/main.nhn?code='
const SISE_BASE_URL
= 'https://finance.naver.com/item/sise_day.nhn?code='

// 삼성전자, 네이버, 현대모비스, 카카오
const companyList = [{
    name: '삼성전자',
    code: '005930'
},{
    name: '네이버',
    code: '035420'
},{
    name: '현대모비스',
    code: '012330'
},{
    name: '카카오',
    code: '035720'
}]

function * reqDays(url,name){
    const resource = yield nightmare
        .goto(url)
        .evaluate(() => document.body.innerHTML)
    // => nightmare를 사용 웹드라이버에 접속 웹스크래핑 할 수 있음
    // => goto(url) : 특정 url 접속
    // => goto로 들어간 url에 evaluate 필요한 정보를 가지고 온 다음
    // => document.body.innerHTML에 넣어줌
    const $=cheerio.load(resource);
    const ret = []
    $('tr').each((idx,element)=>{
        const tds = $(element).find('td');
        const date = $(tds[0]).find('span').eq(0).text().trim()
        
        if(date.length === 0 || idx === 16)
        return;

        const value = $(tds[1]).find('span').eq(0).text().trim()
        const increaseOrdecrease = $(tds[2]).find('span').eq(0).text().trim()
        const isInc = $(tds[2]).find('span').eq(0).attr('class').includes("red02")

        ret.push({
            date,
            value,
            increaseOrdecrease,
            isInc
        })
    });
    return ret
}
const run  = function*(){ 
    let ret = {}
    for(let company of companyList){ 
        const name = company.name
        const code = company.code
         
        const a = yield  * reqDays(SISE_BASE_URL + code, name)
        const obj = {
            [name] : a
        }
        ret = {
            ...ret, 
            ...obj
        } 
    }   
    return ret
}

const reqToday = (url, name) => {
    return new Promise((resolve, reject)=>{
        axios.get(url).then((res) => {
            const $ = cheerio.load(res.data);
            const data = $('.no_today').eq(0).text().trim().split('\n')[0];
            const numData = ~~data.split(',')[0]*1000+~~data.split(',')[1]
            resolve({
                [name]:numData
            })
            .catch(e=>resolve(null));
        })
    })
}

app.get('/stocks/today', async (req, res) => {
    const urlList = companyList.map(e => reqToday(DAY_BASE_URL + e.code, e.name))
    const ret = await Promise.all(urlList)
    let obj = {}
    ret.forEach(e => {
        obj = {
            ...e,
            ...obj
        }
    })
    res.send(obj)
})

app.get('/stocks/days', (req,res) => {
    vo(run)(function(err, data){
        if(err)console.log(`err : ${err}`)
        res.send(data)
    })
})
app.listen(PORT, () => {
    console.log(`서버가 시작되었습니다. http://127.0.0.1:${PORT}`)
})