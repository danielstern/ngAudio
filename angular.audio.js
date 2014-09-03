angular.module('ngAudio', [])
    .directive('ngAudio', function($compile, $q, ngAudio) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {

                var audio = ngAudio.load($attrs.ngAudio);
              
            },
            controller: function($scope, $attrs, $element,$timeout) {

                $element.on('click', function(e) {
                    audio.pause();
                    audio.volume = $attrs.volume || audio.volume;
                    audio.currentTime = $attrs.start || 0;
                    
                    $timeout(function(){
                        audio.play();
                    },5);
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

        audio.addEventListener('loadstart', function(e) {
            deferred.resolve(audio);
        })

        // bugfix for chrome...
        setTimeout(function() {
            audio.src = url;
        }, 1);

        return deferred.promise;

    }
})

.service('cleverAudioFindingService', function($q, localAudioFindingService, remoteAudioFindingService) {
    this.find = function(id) {
        var deferred = $q.defer();

        id = id.replace('|','/');

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

        this.id = id;
        this.safeId = id.replace('/','|'); 

        var audio = undefined;
        var audioObject = this;
        var $progressWatch;
        var $volumeWatch;
        var $currentTimeWatch;
        var $muteWatch;

        var $willPlay = false;
        var $willPause = false;
        var $willRestart = false;
        var $volumeToSet = undefined;

        var $isMuting = false;

        this.play = function() {
            $willPlay = true;
        }

        this.pause = function() {
            $willPause = true;
        }

        this.restart = function() {
            $willRestart = true;
        }

        this.stop = function() {
            this.restart();
        }

        this.setVolume = function(volume) {
            $volumeToSet = volume;
        }

        this.setMuting = function(muting) {
            if (muting === false) $isMuting = false;
            if (muting === true) $isMuting = true;

        }

        cleverAudioFindingService.find(id)
            .then(function(nativeAudio) {
                audio = nativeAudio;
                audio.addEventListener('canplay',function(e){
                    audioObject.canPlay = true;
                })
            }, function(error) {
                console.warn("Couldn't load::", id);
                audioObject.error = true;
            });


        this.setProgress = function(progress) {
            if (audio.duration) {
                audio.currentTime = audio.duration * progress;
            }
        }

        this.setCurrentTime = function(currentTime) {
            if (audio.duration) {
                audio.currentTime = currentTime;
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

            $currentTimeWatch = $rootScope.$watch(function() {
                return audioObject.currentTime;
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                audioObject.setCurrentTime(newValue);
            }, true);

            $muteWatch = $rootScope.$watch(function() {
                return audioObject.muting;
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                audioObject.setMuting(newValue);
            }, true);
        }

        function $clearWatch() {
            if ($progressWatch) $progressWatch();
            if ($volumeWatch) $volumeWatch();
            if ($currentTimeWatch) $currentTimeWatch();
            if ($muteWatch) $muteWatch();
        }


        $interval(function() {
            $clearWatch();
            if (audio) {

                if ($isMuting || ngAudioGlobals.isMuting) {
                    audio.volume = 0;
                } else {
                    audio.volume = audioObject.volume || 1;
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
                    audio.volume = $volumeToSet;
                    $volumeToSet = undefined;
                }



                audioObject.currentTime = audio.currentTime;
                audioObject.duration = audio.duration;
                audioObject.remaining = audio.duration - audio.currentTime;
                audioObject.progress = audio.currentTime / audio.duration;
                audioObject.src = audio.src;
                audioObject.paused = audio.paused;


                if (!$isMuting && !ngAudioGlobals.isMuting) {
                    audioObject.volume = audio.volume;
                }

                audioObject.audio = audio;
            }
            $setWatch();
        },1);
    }
})

.service('ngAudio', function(ngAudioObject, ngAudioGlobals) {
    this.play = function(id) {
        var audio = new ngAudioObject(id);
        audio.play();
        return audio;
    };

    this.load = function(id) {
        return new ngAudioObject(id);
    };

    this.mute = function() {
        ngAudioGlobals.muting = true;
    };

    this.unmute = function() {
        ngAudioGlobals.muting = false;
    };

    this.toggleMute = function() {
        ngAudioGlobals.muting = !ngAudioGlobals.muting;
    };


});
