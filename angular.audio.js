'use strict';
/* NG AUDIO MOD
@github: danielstern
License: PLEASE USE FOR EVIL*/

angular.module('ngAudio', [])
    .directive('ngAudio', function($compile, ngAudio, $q) {
        return {
            restrict: 'AEC',
            link: function(scope,element,attrs) {

              if (element[0].nodeName == 'NG-AUDIO') {

                  var audio = angular.element(document.createElement('audio'));
                  audio.attr('ng-audio');

                  element.attr('id', '');
                  for (var prop in attrs.$attr) {
                      audio.attr(prop, attrs[prop]);
                  };

                  var el = $compile(audio)(scope);
                  element.append(audio);
              }

            },
            controller: function($scope, $attrs, $element) {

                $element.on('click', function(e) {
                    ngAudio.play($attrs.ngAudio);
                })
            },
        }
    })

.service('ngAudioLoader', function($q, AudioObject) {
    var allSoundsLoaded = [];

    this.getAllSounds = function() {
        return allSoundsLoaded;
    }
    this.loadAudio = function(str, audioObj) {
        var r = $q.defer();

        if (soundLoaded(str)) return;

        var $sound = document.getElementById(str);
        if ($sound) {
            audioObj.setSound($sound);
            audioObj.src = $sound.getAttribute('src');
            audioObj.defaultVolume = $sound.getAttribute('volume') || 0;
            audioObj.startAt = $sound.getAttribute('startAt') || 0;
            audioObj.defaultSong = $sound.hasAttribute('song');
            audioObj.selector = str;

            if (audioObj.defaultVolume) {
                audioObj.setVolume(audioObj.defaultVolume);
            }

            if (audioObj.defaultSong) {
                audioObj.enableSong();
            }

            if (!soundLoaded(str)) allSoundsLoaded.push(audioObj);
            r.resolve(audioObj);


        } else {

            _load(str)
                .then(function(res) {
                    audioObj.setSound(res);
                    audioObj.src = str;
                    if (!soundLoaded(str)) allSoundsLoaded.push(audioObj);
                    r.resolve(audioObj);
                });
        }

        audioObj.addListener(function(type, target) {
            if (type == 'song-play') {
                var songs = getAllSongs();
                songs.forEach(function(song) {
                    if (song.src != target.src)
                        song.stop();
                })
            }
        })

        return r.promise;

    };

    var getAllSongs = function() {

        // return _.filter(allSoundsLoaded, function(audioObj) {
        return allSoundsLoaded.filter(function(audioObj) {
            if (audioObj.isSong()) return audioObj;
        })
    }

    this.getAllSongs = getAllSongs;

    function soundLoaded(id) {
        return allSoundsLoaded.filter(function(audioObj) {
            if (audioObj.src == id) return true;
            if (audioObj.selector == id) return true;
        })[0];
    }

    this.getAudio = function(id) {

        var matchingSound = soundLoaded(id);
        var audioObj = matchingSound || new AudioObject();

        if (!matchingSound) {
            audioObj.src = id;
            audioObj.selector = id;
        }
        this.loadAudio(id, audioObj);
        return audioObj;

    }

    function _load(uri) {
        var k = $q.defer();
        var audio = new Audio();

        //   audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
        audio.src = uri;

        var i = setInterval(function() {
            if (audio.play) {
                soundCanPlay();
                clearInterval(i);
            }
        })

        function soundCanPlay() {
            k.resolve(audio);
        }
        return k.promise;
    }



})

.factory('AudioObject', function() {
  return function(){
        this.play = undefined;
        this.stop = undefined;
        this.sound = undefined;
        var oldVolume = 1;
        var song = false;
        var o = this;
        var muting = false;
        var deferredPlay = false;
        var listeners = [];
        var songmuting = false;
        var volume = 1;

        this.getVolume = function() {
            return this.sound.volume;
        };

        this.addListener = function(li) {
            listeners.push(li);
        }

        this.setVolume = function(vol) {
            this.sound.volume = vol;
        };

        this.toggleMute = function() {
            (muting) ? this.unmute() : this.mute();
        }

        this.mute = function() {
            muting = true;
            oldVolume = volume;
            volume = 0;
            this.setVolume(volume)
        };

        this.muteSong = function() {
            songmuting = true;
            oldVolume = volume;
            volume = 0;
            this.setVolume(volume)
        }

        this.unmuteSong = function() {
            songmuting = false;
            volume = oldVolume || 1;
            this.setVolume(volume)
        }

        this.unmute = function() {
            muting = false;
            volume = oldVolume || 1;
            if (this.isSong() && songmuting) return;
            this.setVolume(volume)
        }

        this.setVolume = function(vol) {
            volume = vol;
            try {

                this.sound.volume = vol;
            } catch (e) {
                console.warn("sound edit error.")
            }
        }


        this.play = function(_sound) {
            var sound = _sound || this.sound;
            if (!sound) {
                deferredPlay = true;
                return;
            }
            console.log("Playing", this);
            deferredPlay = false;

            if (muting) return;
            //if (this.isSong() && songmuting) return;

            if (!this.isSong()) this.stop();

            if (this.startAt && sound.currentTime < this.startAt) {
                sound.currentTime = Number(this.startAt);
            }

            if (song) {
                listeners.forEach(function(li) {
                    li('song-play', o);
                })
            }

            //if (this.isSong() && songmuting) return;
            this.setVolume(volume);
            if (songmuting) return;
            sound.play();
        };

        var i;

        this.stop = function() {
            //if (!this.sound || !this.sound.play) return;
            this.pause();
            if (this.sound && this.sound.currentTime) this.sound.currentTime = 0;
        };

        this.pause = function() {
            if (!this.sound) return;
            this.sound.pause();
        }

        this.setSound = function(_sound) {
            o.sound = _sound;
            o.handleDeffered(_sound);
        }

        this.handleDeffered = function(_sound) {
            if (deferredPlay) {
                this.play(_sound);
            }
        }


        this.enableSong = function() {
            song = true;
            this.song = true;
        };

        this.isSong = function() {
            return song;
        }

      }

    })

/* Service for use inside code */
.service('ngAudio', function($q, ngAudioLoader) {
    var a = this,

        muting = false,
        songmuting = false;

    function eachify(arg) {
        if (!arg instanceof Array) {
            arg = [arg];
        }

        return arg;
    }


    this.play = function(id) {
        if (muting) return;

        var audioObj = ngAudioLoader.getAudio(id);
        audioObj.play();

        if (songmuting && audioObj.isSong()) audioObj.muteSong();
    }

    this.getAllSongs = ngAudioLoader.getAllSongs;

    this.isMusic = function(ids) {

        var eachifiedIds = eachify(ids);

        eachify(ids).forEach(function(id) {
            var audioObj = ngAudioLoader.getAudio(id);
            audioObj.enableSong();
        })
    }

    this.muteAll = function() {

        ngAudioLoader.getAllSounds().forEach(function(audioObj) {
            audioObj.mute();
        })

        muting = true;
    }

    this.unmuteAll = function() {
        ngAudioLoader.getAllSounds().forEach(function(audioObj) {
            audioObj.unmute();
        })
        muting = false;
    }

    this.stopAll = function() {
        ngAudioLoader.getAllSounds().forEach(function(audioObj) {
            audioObj.stop();
        })
    }

    this.toggleMuteAllSongs = function() {
        songmuting = !songmuting;
        var allSongs = ngAudioLoader.getAllSongs();

        if (songmuting) {
            allSongs.forEach(function(audioObj) {
                audioObj.muteSong();
            })
        } else {
            allSongs.forEach(function(audioObj) {
                audioObj.unmuteSong();
            })
        }
    }

    this.toggleMuteAll = function() {
        muting ? a.unmuteAll() : a.muteAll();
    }

    this.toggleMute = function(ids) {

        eachify(ids).forEach(function(id) {
            var audioObj = ngAudioLoader.getAudio(id);
            audioObj.toggleMute();
        });
    }

    this.mute = function(ids) {

        eachify(ids).forEach(function(id) {
            var audioObj = getAudio(id);
            audioObj.mute();
        })
    };


    this.unmute = function(ids) {

        eachify(ids).forEach(function(id) {
            var audioObj = getAudio(id);
            audioObj.unmute();
        })
    };


    this.getSoundVolume = function(id) {
        var $sound = ngAudioLoader.getAudio(id);
        return $sound.getVolume();
    }

    this.setSoundVolume = function(id, vol) {
        var $sound = ngAudioLoader.getAudio(id);
        $sound.setVolume(vol);
    }

    this.stop = function(ids) {
        eachify(ids).forEach(function(id) {
            var $sound = ngAudioLoader.getAudio(id);
            $sound.stop();
        });
    };
})
