handleSankeyTreeData = (condition, callback) => {
  megaFetch(condition, 1, 1000, [], callback);
};

const formatData = (condition, data, callback) => {
  var formattedObj = {
    nodes: [
      { node: 0, name: condition, id: "Root" },
      { node: 1, name: "None" },
      { node: 2, name: "Expanded Access" },
      { node: 3, name: "Observational" },
      { node: 4, name: "Interventional" },
      { node: 5, name: "Phase 1" },
      { node: 6, name: "Phase 2" },
      { node: 7, name: "Phase 3" },
      { node: 8, name: "Phase 4" }
    ],
    links: []
  };
  var nodeObj = {
    Root: 0,
    None: 1,
    "Expanded Access": 2,
    Observational: 3,
    Interventional: 4,
    "Phase 1": 5,
    "Phase 2": 6,
    "Phase 3": 7,
    "Phase 4": 8
  };

  var counterObj = {};
  let listObj = {};
  var nodeCounter = 9;

  Promise.all(
    data.map(object => {
      if (listObj[object["Phase"]]) {
        listObj[object["Phase"]].push(object);
      } else {
        listObj[object["Phase"]] = [object];
      }

      if (!Object.keys(nodeObj).includes(object.StudyType[0])) {
        nodeObj[object.StudyType[0]] = nodeCounter;
        formattedObj["nodes"].push({
          node: nodeCounter,
          name: object.StudyType[0]
        });
        nodeCounter += 1;
      }

      if (
        !Object.keys(nodeObj).includes(object.Phase[0]) &&
        object.Phase[0] !== undefined
      ) {
        nodeObj[object.Phase[0]] = nodeCounter;
        formattedObj["nodes"].push({
          node: nodeCounter,
          name: object.Phase[0]
        });
        nodeCounter += 1;
      }
      if (Object.keys(counterObj).includes(object.StudyType[0])) {
        var phase = object.Phase[0] != undefined ? object.Phase[0] : "None";
        if (counterObj[object.StudyType][phase]) {
          counterObj[object.StudyType][phase] += 1;
        } else {
          counterObj[object.StudyType][phase] = 1;
        }
      } else {
        var phase = object.Phase[0] != undefined ? object.Phase[0] : "None";
        counterObj[object.StudyType] = { [phase]: 1 };
      }
    })
  )
    .then(() => {
      Object.entries(counterObj).map(elem => {
        var total = 0;
        Object.entries(elem[1]).map(innerElem => {
          total += innerElem[1];
          formattedObj["links"].push({
            source: nodeObj[elem[0]],
            target: nodeObj[innerElem[0]],
            value: innerElem[1]
          });
        });

        formattedObj["links"].push({
          source: 0,
          target: nodeObj[elem[0]],
          value: total
        });
      });
    })
    .then(() => callback(formattedObj, listObj))
    .catch(err => console.log("Error in formatData: ", err));
};

const megaFetch = (
  condition = "heart attack",
  min = 1,
  max = 1000,
  totalResult = [],
  callback
) => {
  let loaderCounter = document.getElementById("loaderCounter");

  var currentRes = totalResult;
  let megaUrl = `https://clinicaltrials.gov/api/query/study_fields?expr=${condition}&fields=BriefTitle%2CStudyType%2CPhase%2CStartDate&min_rnk=${min}&max_rnk=${max}&fmt=json`;
  fetch(megaUrl)
    .then(rawRes => rawRes.json())
    .then(cleanRes => {
      loaderCounter.innerHTML = `Studies fetched: ${max}`;
      currentRes.push(...cleanRes.StudyFieldsResponse.StudyFields);
      if (cleanRes.StudyFieldsResponse.NStudiesReturned === 1000) {
        megaFetch(condition, min + 1000, max + 1000, currentRes, callback);
      } else {
        formatData(condition, currentRes, callback);
      }
    })
    .catch(err => {
      console.log(err);
      stateHandler("error");
    });
};
