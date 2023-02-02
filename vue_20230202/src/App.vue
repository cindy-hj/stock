<template>
  <div>
    <nav>
      <ul>
        <li @click="setName('삼성전자')" :class="{'nav-active':name === '삼성전자'}">삼성전자</li>
        <li @click="setName('현대모비스')" :class="{'nav-active':name === '현대모비스'}">현대모비스</li>
        <li @click="setName('카카오')" :class="{'nav-active':name === '카카오'}">카카오</li>
        <li @click="setName('네이버')" :class="{'nav-active':name === '네이버'}">네이버</li>
      </ul>
    </nav>  
    <!-- 2. 로딩영역 back 영역이 loading값이 true일때만
    로딩이 되었다가 화면이 모두 로드되면 false로 변경되게 onMounted 영역에 표시함 -->
    <div class="back" v-if="loading">
      <div class="background"></div>
      <div class="v-loading default">
        <div class="effect-1 effects"></div>
        <div class="effect-2 effects"></div>
        <div class="effect-3 effects"></div>
      </div>
    </div>
    
    <div>
      <h1>{{ herestk }}</h1> 
      <p class="message">{{ message }}</p>
      <p>{{ name }} - 목표매수금액</p>
      <div class="target">
        <input type="number" v-model.number="targetCur" step="500"/>
        <button @click="setTarget()">설정</button>
      </div>     
    </div>

    <div class="svgWrap">
      <svg></svg>
    </div>
  
    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>날짜</th>
            <th>종가</th>
            <th>증감</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stock, idx) in herestksise" :key="idx">
            <td>{{ stock.name }}</td>
            <td>{{ stock.value }}</td>
            <td :class="{'active':stock.isInc, 'not-active':!stock.isInc}">
              <i v-if="stock.isInc">▲</i>
              <i v-else>▼</i>
              {{ stock.increaseOrdecrease }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
import * as d3 from "d3";
import { ref, onMounted } from "vue";
import axios from "axios";

export default {
  name: 'App',
  setup () {
    let name = ref('삼성전자');
    let message = ref('');
    let targetCur = ref(0);
    let herestk = ref({});
    let herestksise = ref([]);
    let loading = ref(true);

    // d3.select 
    // - 현재 문서에서 특정 태그 하나를 선택
    // d3.selectAll 
    // - 현재 문서에서 특정 태그 전체를 선택
    // selection.attr 
    // - 선택된 태그의 속성값 지정
    // selection.data 
    // - 참조 연결할 데이터 가져옴(선택된 태그에 데이터 매칭)
    // selection.enter 
    // - 데이터 갯수만큼 태그가 부족할시에 플레이스홀더를 반환
    // selection.append 
    // - 새로운 태그를 추가
    // selection.exit 
    // - 종료(더 이상 필요없는 태그는 반환)
    // selection.remove 
    // - 현재 문서에서 선택된 태그를 제거
    
    const draw = (target, now) => {
      d3.select("svg").selectAll("g").remove();
      const remain = ((now - Math.max(now - target, 0)) / now) * 100
      if(remain === 100) {
        message.value = `지금 사야 합니다!`
      } else if (remain >= 50) {
        message.value = `${Math.round(remain)}%에요 좀만 참으세요`
      } else {
        message.value = `${Math.round(remain)}%입니다. 장기적으로 바라보죠.`
      }

      const width = 350
      const height = 350
      const radius = Math.min(width, height) / 2.3
      const group = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate("+ width / 2 + "," + height / 2 + ")")
      
      const pieGenerator = d3.pie().sort(null)
      const arc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius)
      
      const textDOM = 
        group.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", ".3em")
          .attr("font-size", "3rem")
          .arrt("font-weight", "bold")
      
        group.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "-2em")
          .text("목표까지")

        group.append("path")
          .data(pieGenerator([1]))
          .attr("class", "backColor")
          .attr("d", arc)
        
      const foreground = group.append("path")
      .data(pieGenerator([0, 100]))
      .attr("class", (d, i) => `frontColor${i}`)
      .attr("d", arc)
        
      const format = d3.format(".0%")

      function arcTween(pie) {
         return function (d) {
          const interpolate = d3.interpolate(pie[0].startAngle, pie[0].endAngle)
          const interpolateText = d3.interpolate(0, pie[0].value)
          return function (t) {
            d.endAngle = interpolate(t)
            textDOM.text(format(interpolateText(t) / 100))
            return arc(d)
          }
        }
      }

      foreground.transition()
        .duration(1500)
        .attrTween("d", arcTween(pieGenerator([remain, 100 - remain])))
        .delay(1000)
    }

    const setTarget = () => {
      setlc(name.value, targetCur.value)
      draw(targetCur.value, herestk.value)
    }

    let stock = {}
    let stockSise = {}
    const getlc = name => {
      return localStorage.getItem(name) || 0
    }
    const setlc = (name, value) => {
      localStorage.setItem(name, value)
    }
    let setName = (payload) => {
      name.value = payload
      herestk.value = stock[payload]
      herestksise.value = stockSise[payload]
      targetCur.value = getlc(payload)
      draw(targetCur.value, herestk.value)
    }

    onMounted(() => {
      Promise.all([
        axios.get("http://127.0.0.1:12010/stocks/today"),
        axios.get("http://127.0.0.1:12010/stocks/days")
      ])
      .then(res => {
        loading.value = false
        stock = res[0].data
        stockSise = res[1].data
        setName("삼성전자")
      })

      setInterval(()=> {
        axios.get("http://127.0.0.1:12010/stocks/today")
        .then(res => {
          stock = res.data
          herestk.value = stock[name.value]
          draw(targetCur.value, herestk.value)
        })
      }, 1000 * 60)
    })

    return {
      loading,
      name,
      message,
      targetCur,
      stock,
      stockSise,
      setName,
      herestksise,
      herestk,
      setTarget
    }
  }
}
</script>

<style lang="css" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
ul{
  list-style: none;
  margin: 0 auto;
  padding: 30px 0 0 0;
}
li:hover{
  cursor: pointer;
}
li{
  display: inline-block;
  margin: 0 10px;
}
table{
  margin: 0 auto;
  border: 1px solid black;
  margin-top: 20px;
  width: 100%;
}
table th, table td{
  padding: 10px;
  border-top: 5px solid black;
  border-bottom: 2px solid black;
}
tbody tr:nth-of-type(odd){
  background: rgba(80, 200, 100, 0.4);
}
.back{
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  /* => 윈도우의 크기값을 설정 */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5;
}
.background{
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(5px);
  position: absolute;
  top: 0;
  left: 0;
}
@keyframes rotate{
  0%{
    transform: rotate(0deg);
  }
  100%{
    transform: rotate(1turn);
  }
}
@keyframes rotateOpacity{
  0%{
    transform: rotate(0deg);
    opacity: 0;
  }
  100%{
    transform: rotate(1turn);
    opacity: 1;
  }
}
.v-loading.default.effect-1{
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-left: 3px solid burlywood;
  border-radius: 50%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  animation: rotate 1s ease infinite;
}
.v-loading.default.effect-2{
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-left: 3px solid burlywood;
  border-radius: 50%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  animation: rotateOpacity 1s ease infinite 0.1;
}
.v-loading.default.effect-3{
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-left: 3px solid burlywood;
  border-radius: 50%;
  box-sizing: border-box;
  transition: all 0.3s ease;
  animation: rotateOpacity 1s ease infinite 0.3;
}
.nav-active{
  border-bottom: 2px solid blueviolet;
  font-weight: 900;
  color: aquamarine;
}
.active{
  color: red;
}
.not-active{
  color: blue;
}


h1{
  font-size: 30px;
  margin: 10px;
}
.svgWrap{
  position: relative;
  margin: 0 auto;
}
.tableWrap{

}
.message{
  font-weight: 900;
  color: beige;
  margin: 0 auto;
}
.target{
  display: flex;
}
input{
  width: 80%;
  font-size: 20px;
  padding: 10px;
}
button{ 
  width: 20%;
  font-size: 14px;
  border: 1px solid black;
}
button:hover{
  background-color: azure;
}

</style>