angular.module('ngAudio', [])
    .directive('ngAudio', function($compile, $q, ngAudio) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                /**
              If used as an element, automatically convert to attribute form.
            **/
                if (element[0].nodeName == 'NG-AUDIO') {
                    var audio = angular.element(document.createElement('audio'));
                    audio.attr('ng-audio');

                    element.attr('id', '');
                    for (var prop in attrs.$attr) {
                        audio.attr(prop, attrs[prop]);
                    }

                    var el = $compile(audio)(scope);
                    element.append(audio);
                }

            },
            controller: function($scope, $attrs, $element) {

                $element.on('click', function(e) {
                    ngAudio.play($attrs.ngAudio);
                });

            },
        };
    })

.service('localAudioFindingService', function($q, $timeout) {

    this.find = function(id) {
        var deferred = $q.defer();
        var $sound = document.getElementById(id);
        if ($sound) {
            deferred.resolve($sound);
        } else {
            deferred.reject(id);
        }

        return deferred.promise;
    }
})

.service('remoteAudioFindingService', function($q) {

    this.find = function(url) {
        var deferred = $q.defer();
        var audio = new Audio();

        audio.addEventListener('error', function(e) {
            deferred.reject();
        });

        audio.addEventListener('canplay', function(e) {
            deferred.resolve(audio);
        })

        // bugfix for chrome...
        setTimeout(function() {
            audio.src = url;
        }, 1);

        return deferred.promise;

    }
})

.service('cachedAudioFindingService', function($q, audioCacheService) {

    this.find = function(url) {
        this.getSounds().forEach(function(sound) {

        })
    }
})

.service('audioCacheService', function(remoteAudioFindingService, localAudioFindingService) {
    this.cachedSounds = [];

    remoteAudioFindingService.onGetSound(function(sound) {
        this.cachedSounds.push(sound);
    });

    this.push = function(audio) {
        cachedSounds.push(audio);
    };

    this.getSounds = function() {
        return this.cachedSounds;
    }
})

.service('cleverAudioFindingService', function($q, localAudioFindingService, remoteAudioFindingService) {
    this.find = function(id) {
        var deferred = $q.defer();

        localAudioFindingService.find(id)
            .then(deferred.resolve, function() {
                return remoteAudioFindingService.find(id)
            })
            .then(deferred.resolve, deferred.reject);

        return deferred.promise;
    }
})

.value('ngAudioGlobals', {
    muting: false,
    songmuting: false
})

.factory("ngAudioObject", function(cleverAudioFindingService, $rootScope, $interval, $timeout, ngAudioGlobals) {
    return function(id) {

        var audio = undefined;
        var audioObject = this;
        var $progressWatch;
        var $volumeWatch;

        var $willPlay = false;
        var $willPause = false;
        var $willRestart = false;
        var $volumeToSet = undefined;

        var $isMuting = false;

        this.play = function() {
            $willPlay = true;
        }

        this.mute = function() {
            $isMuting = true;
            this.muting = true;
        }

        this.unmute = function() {
            $isMuting = false;
            this.muting = false;
        }

        this.pause = function() {
            $willPause = true;
        }

        this.restart = function() {
            $willRestart = true;
        }

        this.setVolume = function(volume) {
            // $volumeToSet = volume;
            audio.volume = $volumeToSet;
        }

        cleverAudioFindingService.find(id)
            .then(function(nativeAudio) {
                audio = nativeAudio;
            }, function(error) {
                console.error("Couldn't load::", id);
                audioObject.error = true;
            });


        this.setProgress = function(progress) {
            // audio.pause();
            if (audio.duration) {
                audio.currentTime = audio.duration * progress;
            }
        }

        function $setWatch() {

            $progressWatch = $rootScope.$watch(function() {
                return audioObject.progress;
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                audioObject.setProgress(newValue);
            }, true);

            $volumeWatch = $rootScope.$watch(function() {
                return audioObject.volume;
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                audioObject.setVolume(newValue);
            }, true);
        }

        function $clearWatch() {
            if ($progressWatch) $progressWatch();
            if ($volumeWatch) $volumeWatch();
        }


        $interval(function() {
            $clearWatch();
            if (audio) {

                if (!ngAudioGlobals.muting && $isMuting) {
                    // audio.volume = audioObject.volume || audio.volume;
                }

                if ($willPlay) {
                    audio.play();
                    $willPlay = false;
                }

                if ($willRestart) {
                    audio.pause();
                    audio.currentTime = 0;
                    $willRestart = false;
                }

                if ($willPause) {
                    audio.pause();
                    $willPause = false;
                }

                if ($volumeToSet) {
                  
                    $volumeToSet = undefined;
                }



                audioObject.currentTime = audio.currentTime;
                audioObject.duration = audio.duration;
                audioObject.remaining = audio.duration - audio.currentTime;
                audioObject.progress = audio.currentTime / audio.duration;
                audioObject.src = audio.src;
                audioObject.paused = audio.paused;


                if (ngAudioGlobals.muting || $isMuting) {
                    audio.volume = 0;
                }

                audioObject.audio = audio;
            }
            $setWatch();
        })
    }
})

.service('ngAudio', function(ngAudioObject, ngAudioGlobals) {
    this.play = function(id) {
        var audio = new ngAudioObject(id);
        audio.play();
        return audio;
    }

    this.load = function(id) {
        return new ngAudioObject(id);
    }

    this.mute = function() {
        ngAudioGlobals.muting = true;
    }

    this.unmute = function() {
        ngAudioGlobals.muting = false;
    }

    this.toggleMute = function() {
        ngAudioGlobals.muting = !ngAudioGlobals.muting;
    }


})
