// cheerio, axios
const cheerio = require("cheerio");
// cheerio 모듈
// => 제이쿼리 표기법 사용
// => $, 제이쿼리 선택메서드를 활용
// => find('태그'), text('문자열'), filter('요소'), attr('속성'), 
// => each() 배열을 순차적으로 활용
// => children('자식태그') 
const axios = require("axios");
// const { index } = require("cheerio/lib/api/traversing");

const getHtml = async() => {
    try{
        // 예스24 사이트(정보를 가지고 올 사이트)
        // => html 가지고 오기
        return await axios.get('http://www.yes24.com/24/Category/BestSeller');
    }catch(error){
        console.log(error);
    }
}

getHtml().then(html=> {
    // 번호표 뽑는것... 언제 이렇게 해줄게...?
    let ulList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("#bestList ol").children("li");
    // => body 안에 있는 필요 정보 영역 찾기
    $bodyList.each(function(i,ele){
        ulList[i] = {
            // #bestList ol>li>p>a를 찾아서 a의 텍스트 내용 가지고 오기
            bookList:$(this).find('a').text(),
            // #bestList ol>li>p>a를 찾아서 a의 href를 가지고 오기
            url:$(this).find("a").attr("href")
        }
    });
    const data=ulList.filter(n=>n.bookList);
    // => 순서대로 선택
    // => n:index
    // => $(선택자).filter(필터구문)
    // => $(선택자).filter(function(index,selector){})
    return data;
}).then(res=>console.log(res));

