const doc = document,
    omnibox = doc.getElementById("omnibox"),
    navSubmit = doc.getElementById("nav-submit"),
    navBack = doc.getElementById("nav-back"),
    navForward = doc.getElementById("nav-forward"),
    webviewContainer = doc.getElementById('webview-container'),
    draggable = doc.getElementById('draggable'),
    tabContainer = doc.getElementById('tab-container'),
    tabNew = doc.getElementById('tab-new'),
    topchrome = doc.getElementById("topchrome"),
    closeWindow = doc.getElementById('close'),
    miniWindow = doc.getElementById('mini'),
    maxWindow = doc.getElementById('max'),
    snackbar = doc.getElementById('snackbar'),
    rem = parseFloat(getComputedStyle(doc.documentElement).fontSize),
    discordwrapper = doc.getElementById('discord-wrapper'),
    discord = doc.getElementById('discord'),
    root = doc.documentElement,
    lightbar = doc.getElementById('lightbar'),
    discordShadow = doc.getElementById('discord-shadow');

let webview = [],
    webviewhold = [],
    tab = [],
    tabhold = [], //temp storage for rearranging tabs
    tick = {invert:0,fog:0,discord:0,chat:0,rotation:0,theme:0},
    app = chrome.app.window.current(),
    current = 0;

function focusTop(){
  topchrome.classList.add('focus');
  webviewContainer.classList.remove('focus');
}

function setCurrent(k){
  console.log('function setCurrent('+k+')');
  console.log('Set #webview'+k+' as current tab');
  current=k;
  webview[current].classList='current-webview';
  tab[current].classList.add('current');
  omnibox.value=webview[current].src;
  checkHome();
  if(tab.length>1){
    for(let i=0;i<tab.length;i++){
      if(i!==current){
        webview[i].classList.remove('current-webview');
        tab[i].classList.remove('current');
      }
    }
  }
}

function isMaximized(){
  return window.screen.width<=(window.innerWidth+100)||window.screen.height<=(window.innerHeight+100);
}
function isFullscreen(){
  return window.screen.width===window.innerWidth&&window.screen.height===window.innerHeight;
}

function omniUrl(inputSrc){
  omnibox.value=inputSrc;
  checkHome();
}

function closeTab(input){
  console.log('function CloseTab('+input+')');
  if(webviewContainer.childElementCount>1){
    tab[input].classList.add('close');
    setTimeout(function(){
      webview[input].remove();
      webview.splice(input,1);
      tab[input].remove();
      tab.splice(input,1);
      if(!(webview[current])){
        current--;
      }
      setCurrent(current);
    },100);
  }else{
    window.close();
  }
}

function matchUrl(url){
  return url.match(/(?<=:\/\/)(.*)(?=\.)/g)[0].replace(/(www\.)/,'');
}

function newTab(url){
  
  console.log('function newTab('+url+')');
  
  var j = tab.length;
  
  webview[j] = doc.createElement('webview');
  // webview[j].setAttribute('partition',('trusted-'+(Math.random()*10)));
  webview[j].setAttribute('partition','trusted');
  webview[j].currentUrl='';
  webview[j].tabindex=j;
  webview[j].setAttribute('allowtransparency','on');
  webviewContainer.appendChild(webview[j]);

  tab[j] = doc.createElement('div');
  tab[j].classList.add('tab');
  tab[j].tabindex = 10+j;
  tabContainer.insertAdjacentElement('afterbegin',tab[j]);
  setCurrent(j);
  tab[j].addEventListener('click',function(e){
    j=tab.indexOf(this);
    if(e.offsetX+(1.25*rem)>tab[j].scrollWidth&&e.offsetX<tab[j].scrollWidth){
      closeTab(j);
    }else{
      setCurrent(j);
    }
    omnibox.focus();
  });
  tab[j].addEventListener('dblclick',function(e){
      tab[j].setAttribute('data-domain','homework');
  });
  
  webview[j].addEventListener('loadstart',function(e){
    j=webview.indexOf(this);
    lightbar.classList='load';
    if(e.isTopLevel){
      tab[j].setAttribute('data-domain',matchUrl(e.url));
      omnibox.focus();
      if(j===current){
        omniUrl(e.url);
        webviewContainer.style.backgroundColor='#fff0';
        webviewContainer.style.backgroundImage='url(offline/loading.svg)';
      }
    }
  });
  webview[j].addEventListener('loadcommit',function(e){
    j=webview.indexOf(this);
    if(e.isTopLevel){
      tab[j].setAttribute('data-domain',matchUrl(e.url));
      omnibox.focus();
      if(j===current){
        omniUrl(e.url);
        webviewContainer.style.backgroundColor='#fff';
        webviewContainer.style.backgroundImage='none';
      }
    }
  });
  webview[j].addEventListener('loadstop',function(){
    j=webview.indexOf(this);
    lightbar.classList='loaded';
    webviewContainer.style.backgroundColor='#fff';
    webviewContainer.style.backgroundImage='none';
    this.executeScript({file:'blur.js'});
    omniUrl(webview[current].src);
    this.currentUrl=this.src;
    tab[j].setAttribute('data-domain',matchUrl(this.src));
    if(this.src.includes('youtube.com/watch')){
      focusTop();
      snackbar.innerHTML='Click to watch video unblocked';
      snackbar.focus({preventScroll:true});
      setTimeout(function(){
        omnibox.focus();
      },4000);
      snackbar.onclick=function(){
        newTab();
        console.log(webview[j].src);
        webview[current].src='https://www.youtube-nocookie.com/embed/'+String(webview[j].src.match(/(?<=v=)(([^=]*)(?=&)|[^=]*$)/)[0]);
        omnibox.focus();
      };
    }
  });
  webview[j].addEventListener("permissionrequest", function(e) {
    e.request.allow();
  });
  webview[j].addEventListener("newwindow", function(e) {
    focusTop();
    e.window.discard();
    snackbar.innerHTML='Open '+String(e.targetUrl).substr(0,50)+' in new tab? Click to confirm.';
    snackbar.focus({preventScroll:true});
    setTimeout(function(){
      omnibox.focus();
    },4000);
    snackbar.onclick=function(){
      newTab();
      webview[current].src=e.targetUrl;
      omnibox.focus();
    };
  });
  webview[j].addEventListener("dialog", function(e) {
    focusTop();
    snackbar.innerHTML=e.messageText;
    snackbar.focus({preventScroll:true});
    setTimeout(function(){
      omnibox.focus();
      e.dialog.cancel();
    },4000);
    snackbar.onclick=function(){
      e.dialog.ok();
      omnibox.focus();
    };
  });
  
  setTimeout(function(){webview[0].src=url;},1);
  
  omnibox.focus();
}

function checkHome(){
  if(omnibox.value.startsWith('chrome-extension')||omnibox.value=='offline/home.html'||omnibox.value=='undefined'){
    omnibox.value='';
  }
}

function clearAllHistory(){
  for(let i=0;i<tab.length;i++){
    webview[i].clearData(
      {since:0},
      {appcache:true,cache:true,cookies:true,sessionCookies:true,persistentCookies:true,fileSystems:true,indexedDB:true,localStorage:true,webSQL:true}
    );
  }
  topchrome.remove();
  setTimeout(function(){webview[current].remove()},300);
  setTimeout(function(){window.close()},500);
}

newTab('offline/home.html');
checkHome();

navBack.onclick = function(){
  webview[current].back();
};
navForward.onclick = function(){
  webview[current].forward();
};

function submit(){
  let e = omnibox.value;
  if(e){
    if(!(e.includes("."))||e.includes(" ")){
      e = "duckduckgo.com/?q=" + e + "&kp=-2";
    }
    if(!(e.includes("http"))){
      e = "https://" + e;
    }
    webview[current].src=e;
  }else{
    webview[current].src='offline/home.html';
    e='';
  }
  omnibox.value=e;
};

tabNew.onclick = function(){newTab();webview[current].src='offline/home.html';};
navSubmit.onclick=submit();
omnibox.onkeydown=function(e){
  if(e.key==='Enter'){
    submit();
  }
}
miniWindow.onclick = function(){
  app = chrome.app.window.current();
  app.minimize();
};
maxWindow.onclick = function(){
  app = chrome.app.window.current();
  if(isMaximized()){
    app.restore();
  }else{
    app.maximize();
  }
};
closeWindow.onclick = function(){
  app = chrome.app.window.current();
  app.close();
};
//keyboard shortcuts
window.addEventListener('keydown',
function(e){
  if(e.altKey){
    switch(e.key){
      case 'w':
        if(e.ctrlKey){
          clearAllHistory();
        }else{
         closeTab(current);
        }
      break;
      case 'n':
        chrome.app.window.create('browser.html', {
          id:String(Math.random()),
          state:'maximized',
          frame:'none',
          innerBounds: {
              minWidth: 400,
              minHeight: 300
          }
        });
      break;
      case 't':
        newTab();
        webview[current].src='offline/home.html';
      break;
      case '/':
        if(tick.fog){
          topchrome.classList.remove('blur');
          for(let i = 0;i<webview.length;i++){
            webview[i].executeScript({file:'blurfalse.js'});
          }
          tick.fog--;
        }else{
          topchrome.classList.add('blur');
          for(let i = 0;i<webview.length;i++){
            webview[i].executeScript({file:'blurtrue.js'});
          }
          tick.fog++;
        }
      break;
      case 'd':
        if(tick.chat){
          discordwrapper.style.display='none';
          tick.chat--;
        }else{
          discordwrapper.style.display='block';
          tick.chat++;
        }
      break;
      case 'i':
        switch(tick.theme){
          case 0:
            topchrome.classList.add('black');
          break;
          case 1:
            topchrome.classList.remove('black');
            topchrome.classList.add('white');
          break;
          case 2:
            topchrome.classList.remove('white');
            topchrome.classList.add('rgb');
          break;
          case 3:
            topchrome.classList.remove('rgb');
            tick.theme=-1;
          break;
        }
        tick.theme++;
      break;
    }
  }
},false);

window.addEventListener('resize',function(){
  if(topchrome.classList){
    if(isFullscreen()){
      topchrome.classList.add('fullscreen');
      draggable.classList.add('fullscreen');
      webviewContainer.classList.add('fullscreen');
    }else{
      topchrome.classList.remove('fullscreen');
      draggable.classList.remove('fullscreen');
      webviewContainer.classList.remove('fullscreen');
    }
  }
});

setInterval(function(){
  tick.rotation=tick.rotation%360+10;
  topchrome.style.setProperty('--rotation',tick.rotation+'deg');
},100);

discord.addEventListener('loadstop',function(){
  if(this.src==='https://discordapp.com/login'){
    this.classList.add('login');
    discordShadow.classList.add('login');
  }else{
    this.classList.remove('login');
    discordShadow.classList.remove('login');
    tick.discord=0;
  }
});
topchrome.onmouseenter=function(){
  focusTop();
  if(snackbar!==doc.activeElement){
    omnibox.select();
  }
};
omnibox.onmouseenter=function(){
  this.savevalue=this.value;
  this.value=this.value+' ';
  this.value=this.savevalue;
};
webviewContainer.onmouseenter=function(){
  this.classList.add('focus');
  topchrome.classList.remove('focus');
  omnibox.blur();
  if(snackbar!==document.activeElement){
    this.focus();
  }
};
discordShadow.onclick=function(){
  console.log('click');
  if(tick.discord){
    this.classList.remove('menu');
    discord.classList.remove('menu');
    tick.discord=0;
  }else{
    this.classList.add('menu');
    discord.classList.add('menu');
    tick.discord=1;
  }
};

discord.addEventListener('newwindow',function(e){
  newTab();
  webview[current].src=e.targetUrl;
  omnibox.focus();
});