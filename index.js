const API_KEY = "d377a8b663c69ec2ccb22e7622002e42";
const movieForm = document.getElementById("movieForm");
const sortSelect = document.getElementById("sort");
//const composerContainer = document.getElementById("composer");
const searchQuery = "";
let resultsArray = [];

// Replace "RESULT_LIMIT" with the maximum number of results you want to display
const resultLimit = 20;
const imageSize = "w500";

movieForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(movieForm);
  const params = new URLSearchParams(formData);
  const searchQuery = params.toString();

  getResults(searchQuery);
});

sortSelect.addEventListener("change", (event) => {
  if (resultsArray.length > 0) {
    displayResults(event.target.value);
    console.log('rest');
  }
})


const getConfiguration = async() => {
    const response = await fetch("https://api.themoviedb.org/3/configuration?api_key=d377a8b663c69ec2ccb22e7622002e42");
    return response.json();
};
//get crew data based on movieID
const getCrewData = async (mediaId, mediaType) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${mediaId}/credits?api_key=${API_KEY}`
  );
  return response.json();
};

//get IMDB link of the composer
const getComposerLinks = async (composerIds) => {
  const composerLinks = await Promise.all(
    composerIds.map(async (composerId) => {
      const response = await fetch(
        `https://api.themoviedb.org/3/person/${composerId}?api_key=${API_KEY}&language=en-US`
      );
      const composerData = await response.json();
      const imdbId = composerData.imdb_id;
      return `<a href="https://www.imdb.com/name/${imdbId}" target="_blank">${composerData.name}</a>`;
    })
  );

  return composerLinks;
};

const getResults = async (query) => {
  resultsArray = [];
  // Fetch the search results from the movie database API
  const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&${query}&page=1&include_adult=false`);
  const data = await response.json();
  const results = data.results;
  console.log(results);

  //get image configs
  const imgConfig = await getConfiguration();
  console.log(imgConfig);
  const base_url = imgConfig.images.base_url;

  // Loop through the results, get the composers and display the result on the page
  for (let i = 0; i < resultLimit && i < results.length; i++) {
    const result = results[i];
    const mediaType = result.media_type;
    if (mediaType === "person") {
        break;
    }
    
    const title = result.title || result.name;
    const overview = result.overview;
    const releaseDate = result.release_date || result.first_air_date;
    const thumbnail = result.poster_path;
    const mediaId = result.id;

    // Get the crew data and credited composers
    const { crew } = await getCrewData(mediaId, mediaType);
    const creditedComposers = crew.filter(person => person.job.toLowerCase().includes("composer") || person.job.toLowerCase() === "music");
    const composerIds = creditedComposers.map(composer => composer.id);

    // Get the composer links
    const composerLinks = await getComposerLinks(composerIds);
    let composerMultiple = "Composer: ";
    if (composerLinks.length > 1) {
      composerMultiple = "Composers: ";
    } else if (composerLinks.length < 1) {
      composerMultiple = "No composers found";
    }

    // Create a new HTML element for the result
    // const resultElement = document.createElement("div");
    // resultElement.setAttribute("class", "card");
    // resultElement.setAttribute("id", "id_" + mediaId);

    // resultElement.innerHTML = `
    //     <div class="wrapper">
    //       <div class="image">
    //         <img class="poster" src="${base_url}${imageSize}/${thumbnail}"
    //       </div>
    //     </div>
    //     <div class="details">
    //       <div class="wrapper">
    //         <div class="title">
    //           <div class="title_header"><h2>${title}</h2><span>(${mediaType})</span></div>
    //           <span class="release_date">${releaseDate}</span>
    //         </div>
    //       </div>
    //       <div class="overview"><p>${overview}</p><b>${composerMultiple}${composerLinks.join(", ")}</b>
    //       </div>
    //     </div>
    //   `;

    // // Add the result element to the page
    // document.getElementById("results").appendChild(resultElement);

    const resObj = {};
    resObj.counter = i;
    resObj.url = `${base_url}${imageSize}${thumbnail}`
    resObj.title = title;
    resObj.mediaType = mediaType;
    resObj.mediaId = mediaId;
    resObj.releaseDate = releaseDate;
    resObj.overview = overview;
    resObj.composerMultiple = composerMultiple;
    resObj.composers = composerLinks.join(", ")
    resObj.popularity = result.popularity;
    resultsArray.push(resObj);
  }

  console.log(resultsArray);
  displayResults(sortSelect.value);

};
const displayResults = (sortBy) => {
  // Clear previous results
  document.getElementById("results").innerHTML = "";
  console.log(typeof sortBy);

  //add result amount
  document.getElementById("result-amount").innerHTML = `(${resultsArray.length})`;

  switch (sortBy) {
    case "relevance": {
      //sort results by popularity
      resultsArray.sort((a, b) => {
        return a.counter - b.counter;
      });
      break;
    }
    case "popularity": {
      //sort results by popularity
      resultsArray.sort((a, b) => {
        return b.popularity - a.popularity;
      });
      break;
    }
    case "release-date-asc": {
      //sort results by date in ascending order
      resultsArray.sort((a, b) => {
        let da = new Date(a.releaseDate),
          db = new Date(b.releaseDate);
        return db - da;
      });
      break;
    }
    case "release-date-desc": {
      //sort results by date in descending order
      resultsArray.sort((a, b) => {
        let da = new Date(a.releaseDate),
          db = new Date(b.releaseDate);
        return da - db;
      });
    }
  }

  resultsArray.forEach((result) => {
    // Create a new HTML element for the result
    const resultElement = document.createElement("div");
    resultElement.setAttribute("class", "card");
    resultElement.setAttribute("id", "id_" + result.mediaId);

    resultElement.innerHTML = `
	       <div class="wrapper">
	         <div class="image">
	           <img class="poster" src="${result.url}" onerror="this.onerror=null;this.src='https://via.placeholder.com/120x180.png?text=No+thumbnail+found'">
	         </div>
	       </div>
	       <div class="details">
	         <div class="wrapper">
	           <div class="title">
	             <div class="title_header"><h2>${result.title}</h2><span>(${result.mediaType})</span></div>
	             <span class="release_date">${result.releaseDate}</span>
	           </div>
	         </div>
	         <div class="overview"><p>${result.overview}</p><b>${result.composerMultiple}${result.composers}</b>
	         </div>
	       </div>
	     `;

    // Add the result element to the page
    document.getElementById("results").appendChild(resultElement);
  });
};
//getResults("query=batman");

