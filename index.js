const API_KEY = "d377a8b663c69ec2ccb22e7622002e42";
const movieForm = document.getElementById("movieForm");
const composerContainer = document.getElementById("composer");
const searchQuery = "";

// Replace "RESULT_LIMIT" with the maximum number of results you want to display
const resultLimit = 20;
const imageSize = "w500";

movieForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(movieForm);
  const params = new URLSearchParams(formData);
  const searchQuery = params.toString();

  displayResults(searchQuery);
});

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

const displayResults = async (query) => {
  // Fetch the search results from the movie database API
  const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&${query}&page=1&include_adult=false`);
  const data = await response.json();
  const results = data.results;
  console.log(results);

  //get image configs
  const imgConfig = await getConfiguration();
  console.log(imgConfig);
  const base_url = imgConfig.images.base_url;

  // Clear previous results
  document.getElementById("results").innerHTML = "";
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

    // Create a new HTML element for the result
    const resultElement = document.createElement("div");
    resultElement.setAttribute("class", "card");
    resultElement.setAttribute("id", "id_" + mediaId);

    resultElement.innerHTML = `
        <div class="wrapper">
          <div class="image">
            <img class="poster" src="${base_url}${imageSize}/${thumbnail}"
          </div>
        </div>
        <div class="details">
          <div class="wrapper">
            <div class="title">
              <div class="title_header"><h2>${title}</h2><span>(${mediaType})</span></div>
              <span class="release_date">${releaseDate}</span>
            </div>
          </div>
          <div class="overview"><p>${overview}</p><b>Composer(s): ${composerLinks.join(", ")}</b>
          </div>
        </div>
      `;

    // Add the result element to the page
    document.getElementById("results").appendChild(resultElement);
  }
};

//displayResults("query=batman");

