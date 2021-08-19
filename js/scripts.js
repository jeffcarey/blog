// Jeff Carey

var state = {
  currentView: "ALL",
  currentId: null,
  postPreviews: [],
  posts: {},
  status: null
};

var Services = {
  GetPosts: "https://restedblog.herokuapp.com/jeffc/api/",
};

function makeAPICall(url, type, callback, params) {
  var oReq = new XMLHttpRequest();

  let paramString;
  oReq.open(type, url);
  if (params && type === "POST") {

    var urlEncodedDataPairs = [];
    for( name in params ) {
       urlEncodedDataPairs.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
    }
    paramString = urlEncodedDataPairs.join("&");
  }

  oReq.onload = function(e) {
    var response;
    if (type === "GET") {
      response = JSON.parse(oReq.response);
    } else {
      response = oReq.response;
    }
    callback(response);
  }
  oReq.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  oReq.send(paramString);
}


// Content display and navigation 
function updateContent(html) {
  document.querySelector("#main").innerHTML = html;
}

function navigate(url) {
  url = url || "/";
  url = url.replace("file://", "");

  var parts = url.split("?");
  var page = parts[0];
  var params = {};

  if (parts[1]) {
    var paramArray = parts[1].split("&");
    for (let i = 0; i < paramArray.length; i++) {
      var paramParts = paramArray[i].split("=");
      params[paramParts[0]] = paramParts[1];
    }
  }

  if (page === "/") {
    showAllPosts();
  } else if (page === "/post-details") {
    showPostDetails(params["id"], params["edit"] === "true");
  }
}
// END Content display and navigation 

// Page specific
function renderPosts() {
  var html = "";
  state.postPreviews.forEach(function (post) {
    var postPreview = post.text && post.text.substring(0, 100);
    html += '<article class="article">' +
      '<div class="article__title">' + post.title + '</div>' +
      '<div class="article__body">' + postPreview + '... <a href="/post-details?id=' + post.id + '">Read more</a></div>' +
    '</article>';
  });

  updateContent(html);
}

function renderPostDetails(id, edit) {
  var html = "";
  var post = state.posts[id];
  state.currentId = id;

  html += '<article class="article">' +
    '<div class="article__title">' + post.title + '</div>' +
    '<div class="article__body">';

    if (edit) {
      html += '<textarea cols="80" rows="5">' + post.text + '</textarea>';
    } else {
      html += post.text;
    }

    html += '<br/><div class="button-row"><a class="action" href="/">Back</a> ';
    
    if (edit) {
      html += '<button class="action" type="button" onclick=updateDetails()>Save</button> ';
    } else {
      html += '<a class="action" href="/post-details?id=' + id +  '&edit=true">Edit</a> ' + 
      '<button class="action" type="button" onclick="deletePost()">Delete</button> ';
    }

    html += '</div></div>' +
  '</article>';

  updateContent(html);
}

function showAllPosts() {
  if (!state.postPreviews.length) {
    makeAPICall(Services.GetPosts, "GET", function(response) {
      state.postPreviews = response;
      renderPosts();
    });
  } else {
    renderPosts();
  }
}

function showPostDetails(id, edit) {
  if (!state.posts[id]) {
    makeAPICall(Services.GetPosts + id, "GET", function(response) {
      state.posts[id] = response;
      renderPostDetails(id, edit);
    });

  } else {
    renderPostDetails(id, edit);
  }
}

function updateDetails() {
  var post = state.posts[state.currentId];
  var textarea = document.querySelector("textarea");
  var newText = textarea.textContent;
  var id = state.currentId;
  makeAPICall(Services.GetPosts, "POST", function(response) {
    response = JSON.parse(response);
    state.posts[id] = response;
    navigate("/post-details?id=" + id)
  }, {title: post.title, text: newText, id: state.currentId });
}

function deletePost() {
  var id = state.currentId;

  makeAPICall(Services.GetPosts + id, "DELETE", function() {
    state.postPreviews = state.postPreviews.filter(function(p) { return p.id.toString() !== id});
    state.currentId = null;
    navigate("/");
  });
}

// END page specific


// App startup
document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", e => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      navigate(e.target.href);
    }
  });

  navigate();
});