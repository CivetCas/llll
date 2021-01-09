/* global chrome */
/* global MD5 getParameterByName parseInt */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function xm_get_token(callback) {
    const domain = 'https://www.xiami.com';
    const name = '_m_h5_tk';
    if (!isElectron()) {
      cookieGet({
        url: domain,
        name,
      }, (cookie) => {
        if (cookie == null) {
          return callback('');
        }
        return callback(cookie.value);
      });
    } else {
      const remote = require('electron').remote; // eslint-disable-line
      cookieGet({
        domain: '.xiami.com',
        name,
      }, (err, cookie) => {
        if (cookie.length === 0) {
          return callback('');
        }
        return callback(cookie[0].value);
      });
    }
  }

  function xm_get_api_url(api, data) {
    const baseUrl = 'https://acs.m.xiami.com/h5/';
    return encodeURI(`${baseUrl + api}/1.0?api=${api}&appKey=${data.appKey}&data=${data.request_str}&dataType=json&sign=${data.sign}&t=${data.t}&type=originaljson&v=1.0`);
  }

  function xm_cookie_get(hm, api, params, callback) {
    xm_get_token((token) => {
      let data = xm_sign_get(token, params);
      let url = xm_get_api_url(api, data);
      hm.get(url).then((response) => {
        if (response.data.ret[0] === 'FAIL_SYS_TOKEN_EXOIRED::令牌过期' || response.data.ret[0] === 'FAIL_SYS_TOKEN_EMPTY::令牌为空') {
          // token expire, refetch token and start get url
          xm_get_token((token2) => {
            data = xm_sign_get(token2, params);
            url = xm_get_api_url(api, data);
            hm.get(url).then((res) => {
              callback(res);
            });
          });
        } else {
          callback(response);
        }
      });
    });
  }

  function xm_sign_get(token, params) {
    //  https://github.com/metowolf/Meting
    //  https://github.com/LIU9293/musicAPI
    const t = new Date().getTime();
    const appKey = '12574478';
    const signedToken = token.split('_')[0];
    const data = {
      header: {
        //appId: 200,
        //appVersion: 1000000,
        //callId: ,
        //network: 1,
        platformId: 'h5',
        //remoteIp: '192.168.1.101',
        //resolution: '1178*778',
      },
      model: params,
    };
    const request_str = JSON.stringify({
      requestStr: JSON.stringify(data),
    });
    let sign = MD5(`${signedToken}&${t.toString()}&${appKey}&${request_str}`);
    return {
      appKey,
      t,
      request_str,
      sign
    };
  }

  function xm_get_low_quality_img_url(url) {
    return `${url}?x-oss-process=image/resize,m_fill,limit_0,s_330/quality,q_80`;
  }

  function xm_show_playlist(url, hm) {
    const offset = getParameterByName('offset', url);
    const page = offset / 25 + 1;
    return {
      success(fn) {
        const api = 'mtop.alimusic.music.list.collectservice.getcollects';
        const params = {
          key: '',
          limit: 25,
          order: 'recommend',
          page,
        };
        xm_cookie_get(hm, api, params, (response) => {
          const result = response.data.data.data.collects.map((item) => ({
            cover_img_url: xm_get_low_quality_img_url(item.collectLogo),
            title: item.collectName,
            id: `xmplaylist_${item.listId}`,
            source_url: `https://www.xiami.com/collect/${item.listId}`,
          }));
          return fn({
            result,
          });
        });
      },
    };
  }

  // eslint-disable-next-line no-unused-vars
  function xm_bootstrap_track(sound, track, success, failure, hm, se) {
    if (!track.sound_url) {
      const api = 'mtop.alimusic.music.songservice.getsongdetail';
      const song_id = track.id.slice('xmtrack_'.length);
      const params = {
        songId:song_id,
      };
      xm_cookie_get(hm, api, params, (response) => {
        const { data } = response.data.data;
        if (data.songDetail.listenFiles.length > 0) {
          //sound.url = datalistenFile || data[1].listenFile;
          sound.url = get_highest_quality(data.songDetail.listenFiles);
          success();
        } else {
          failure();
        }
      });
    } else {
      sound.url = track.sound_url;
      success();
    }
  }

  function xm_convert_song(song_info) { // eslint-disable-line no-unused-vars
    const track = {
      id: `xmtrack_${song_info.songId}`,
      title: song_info.songName,
      artist: song_info.artistName,
      artist_id: `xmartist_${song_info.artistId}`,
      album: song_info.albumName,
      album_id: `xmalbum_${song_info.albumId}`,
      source: 'xiami',
      source_url: `https://www.xiami.com/song/${song_info.songId}`,
      img_url: song_info.albumLogo,
      //url: `xmtrack_${song_info.songId}`,
      lyric_url: song_info.lyricInfo ? song_info.lyricInfo.lyricFile : '',
    };
    if (song_info.listenFiles && song_info.listenFiles.length > 0) {
      track.sound_url = get_highest_quality(song_info.listenFiles);
    } else {
      track.sound_url = '';
    }
    return track;
  }

  function get_highest_quality(arr) {
    var max = 0;
    var url = "";
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].fileSize > max && arr[i].format != 'ape') {
        max = arr[i].fileSize;
        url = arr[i].listenFile;
      }
    }
    return url;
  }

  function xm_get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_').pop();
    return {
      success(fn) {
        const api = 'mtop.alimusic.music.list.collectservice.getcollectdetail';
        const params = {
          listId: parseInt(list_id, 10),
        };
        xm_cookie_get(hm, api, params, (response) => {
          let { data } = response.data.data;
          const info = {
            cover_img_url: xm_get_low_quality_img_url(data.collectDetail.collectLogo),
            title: data.collectDetail.collectName,
            id: `xmplaylist_${list_id}`,
            source_url: `https://www.xiami.com/collect/${list_id}`,
          };
          const tracks = data.collectDetail.songs.map(item => xm_convert_song(item));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function xm_search(url, hm, se) { // eslint-disable-line no-unused-vars
    const keyword = getParameterByName('keywords', url);
    const curpage = getParameterByName('curpage', url);
    const searchType = getParameterByName('type', url);
    const params = {
      key: keyword,
      pagingVO: {
        page :curpage,
        pageSize: 20
      }
    };
    let api = '';
    switch (searchType) {
      case '0':
        api = 'mtop.alimusic.search.searchservice.searchsongs';
        break;
      case '1':
        api = 'mtop.alimusic.search.searchservice.searchcollects';
    }
    return {
      success(fn) {
        xm_cookie_get(hm, api, params, (response) => {
          let result = [];
          let total = 0;
          let { data } = response.data.data;
          if (searchType === '0') {
            result = data.songs.map(item => xm_convert_song(item));
            total = data.pagingVO.count;
          } else if (searchType === '1') {
            result = data.collects.map(item => ({
              id: `xmplaylist_${item.listId}`,
              title: item.collectName,
              source: 'xiami',
              source_url: `https://www.xiami.com/collect/${item.listId}`,
              img_url: item.collectLogo,
              url: `xmplaylist_${item.listId}`,
              author: item.userName,
              count: item.songCount
            }));
            total = data.pagingVO.count;
          }
          return fn({
            result: result,
            total: total,
            type: searchType
          });
        });
      },
    };
  }

  function xm_album(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const album_id = getParameterByName('list_id', url).split('_').pop();
        const api = 'mtop.alimusic.music.albumservice.getalbumdetail';
        const params = {
          albumId: album_id,
        };
        xm_cookie_get(hm, api, params, (response) => {
          const { data } = response.data.data;
          const info = {
            cover_img_url: data.albumDetail.albumLogo,
            title: data.albumDetail.albumName,
            id: `xmalbum_${album_id}`,
            source_url: `https://www.xiami.com/album/${album_id}`,
          };
          const tracks = data.albumDetail.songs.map(item => xm_convert_song(item));
          return fn({
            tracks,
            info,
          });
        });
      },
    };
  }

  function xm_artist(url, hm, se) { // eslint-disable-line no-unused-vars
    return {
      success(fn) {
        const artist_id = getParameterByName('list_id', url).split('_').pop();

        const target_url = `https://m.xiami.com/graphql?query=query{artistDetail(artistId:%22${artist_id
        }%22,artistStringId:%22${artist_id}%22){artistDetailVO{artistName%20artistLogo}}}`;

        hm.get(target_url).then((response) => {
          const { artistDetailVO: data } = response.data.data.artistDetail;
          const info = {
            cover_img_url: data.artistLogo,
            title: data.artistName,
            id: `xmartist_${artist_id}`,
            source_url: `https://www.xiami.com/artist/${artist_id}`,
          };

          const offset = getParameterByName('offset', url);
          const page = offset / 50 + 1;
          const pageSize = 50; 
          const category = 0;
          const api = 'mtop.alimusic.music.songservice.getartistsongs';
          const params = {
            artistId: artist_id,
            pagingVO: {
              page,
              pageSize
            }
          };
          xm_cookie_get(hm, api, params, (response) => {
            const tracks = response.data.data.data.songs.map(item => xm_convert_song(item));
            return fn({
              tracks,
              info,
            });
          });
        });
      },
    };
  }

  function xm_lyric(url, hm, se) { // eslint-disable-line no-unused-vars
    const lyric_url = getParameterByName('lyric_url', url);
    return {
      success(fn) {
        if (lyric_url) {
          hm.get(lyric_url).then((response) => {
            const data = xm_generate_translation(response.data);
            return fn({
              lyric: data.lrc,
              tlyric: data.tlrc
            });
          });
        } else {
          return fn({
            lyric: '',
            tlyric: ''
          });
        }
      },
    };
  }

    function tag2millisecond(time_tag) {
    var reg_time_tag_grouped = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    var r = reg_time_tag_grouped.exec(time_tag);
    var minute = parseInt(r[1]);
    var second = parseInt(r[2]);
    var millisecond = 0;
    if (r.length >= 4) {
      millisecond = parseInt(r[3]);
    }
    var result = minute * 60000 + second * 1000 + millisecond;
    return result;
  }

  function zpad(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  function millisecond2tag(v) {
    var t = Math.abs(v / 1000);
    var h = Math.floor(t / 3600);
    t = t - h * 3600;
    var m = Math.floor(t / 60);
    t = t - m * 60;
    var s = Math.floor(t);
    var ms = t - s;
    var str =
      (h ? zpad(h, 2) + ":" : "") +
      zpad(m, 2) +
      ":" +
      zpad(s, 2) +
      "." +
      zpad(Math.floor(ms * 1000), 3);
    return "[" + str + "]";
  }

  function xm_generate_translation(plain) {
    var reg_xtrans_tag = /\[x-trans\]/;
    var reg_durning_tag = /<\d+>/g;

    var has_translate = plain.search(reg_xtrans_tag) !== -1;
    var has_perword_timestamp = reg_durning_tag.test(plain);
    if (!has_translate && !has_perword_timestamp) {
      return {
        lrc: plain,
        tlrc: "",
      };
    }

    // 处理xtrans标记，替换为上一行的时间轴标记，并加入tlrc结果中
    var lrc = "";
    var tlrc = "";
    var plain_array = plain.split("\n");
    var i = 0;
    var last_time_tag = "[00:00.000]";
    var last_end_timestamp = 0;
    var MAX_ALLOW_GAP_MILLISECOND = 1000;

    while (i < plain_array.length) {
      var line = plain_array[i];
      var reg_time_tag = /(\[\d{2,}:\d{2}(?:\.\d{1,3})?\])/g;
      var time_tag_info = line.match(reg_time_tag);
      if (time_tag_info) {
        // 之前结束是否过早，是否需要添加空白行
        var current_time_tag = time_tag_info[0];
        var current_millisecond = tag2millisecond(current_time_tag);
        if (
          current_millisecond - last_end_timestamp >=
          MAX_ALLOW_GAP_MILLISECOND
        ) {
          var placeholder_time_tag = millisecond2tag(last_end_timestamp);
          lrc += placeholder_time_tag + "\n";
          if (i - 1 >= 0 && plain_array[i - 1].match(reg_xtrans_tag)) {
            // 上一行是翻译行
            tlrc += placeholder_time_tag + "\n";
          }
        }
        // 添加本行时间轴
        lrc += line.replace(reg_durning_tag, "") + "\n";
        last_time_tag = current_time_tag;
        // 计算本行结束时间轴
        var durning = 0;
        line.match(reg_durning_tag) && line.match(reg_durning_tag).forEach((s) => {
          durning += parseInt(s.replace(/[^\d]/g, ""));
        });
        last_end_timestamp = tag2millisecond(last_time_tag) + durning;
      }
      var xtrans_tag = line.match(reg_xtrans_tag);
      if (xtrans_tag) {
        tlrc +=
          line
            .replace(reg_xtrans_tag, last_time_tag)
            .replace(reg_durning_tag, "") + "\n";
      }
      i += 1;
    }
    return {
      lrc: lrc,
      tlrc: tlrc,
    };
  }
  
  function xm_parse_url(url) {
    let result;
    const match = /\/\/www.xiami.com\/collect\/([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `xmplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'xmplaylist':
        return xm_get_playlist(url, hm, se);
      case 'xmalbum':
        return xm_album(url, hm, se);
      case 'xmartist':
        return xm_artist(url, hm, se);
      default:
        return null;
    }
  }
  return {
    show_playlist: xm_show_playlist,
    get_playlist,
    parse_url: xm_parse_url,
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
  };
}

const xiami = build_xiami(); // eslint-disable-line no-unused-vars
