var exports = module.exports = {}
var defaultResponse = {
  "rank" : 0,
  "response": {
    "raw_data": "Training not configured"
  },
  "propertiesMatched": 0,
  "confidene": 0
}

var rankCompare = function(a, b) {

  let comparison = 0;
  if (a.rank > b.rank) {
    comparison = -1;
  } else if (a.rank < b.rank) {
    comparison = 1;
  }
  return comparison;
}

exports.evaluate = (newRequest, currentRank, collection) => {
  if (!newRequest) {
    console.error("param : 'newRequest' should be an object")
    return
  }
  if (!currentRank || !Array.isArray(currentRank)) {
    console.error("param : 'currentRank' should be an array")
    return
  }
  if (!collection || !Array.isArray(collection)) {
    console.error("param : 'collection' should be an array")
    return defaultResponse
  }

  let requestKeys = Object.keys(newRequest)
  currentRank = currentRank.sort((x, y) => x.rank < y.rank).slice(0, 1023);

  collection.forEach(x => {
    x.rank = 0
    let docKeys = Object.keys(x.request.formatted_data)
    x.propertiesMatched = 0
    currentRank.forEach(r => {
      if (docKeys.includes(r.name) && requestKeys.includes(r.name)) {
        if(newRequest[r.name][0] === x.request.formatted_data[r.name][0]){
          x.rank += Math.pow(2, r.rank - 1)
          x.propertiesMatched += 1
        }
      }
    })
  })

  // 16 -> "1000"
  let maxRankBinary = Math.max(...currentRank.map(x => Math.pow(2, x.rank-1))).toString(2)

  // "1" -> "1111" -> 15
  let maxPossibleRank = parseInt("1".repeat(maxRankBinary.length), 2)


  let res = collection.map( x => {
    return {
      rank : x.rank,
      response: {
        raw_data: x.response.raw_data
      },
      propertiesMatched: x.propertiesMatched,
      confidene: parseInt((x.rank/maxPossibleRank) * 100)
    }
  })

  res.sort(rankCompare)

  return res && res.length > 0 ? res[0] : defaultResponse
}