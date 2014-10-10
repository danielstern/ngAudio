angular.module('ngAudio', [])

.directive('ngAudio', ['$compile', '$q', 'ngAudio', function($compile, $q, ngAudio) {
    return {
        restrict: 'AEC',
        scope: {
            volume: "=",
            start: "=",
            currentTime: "=",
            loop: "="
        },
        controller: function($scope, $attrs, $element, $timeout) {

            var audio = ngAudio.load($attrs.ngAudio);
            $element.on('click', function(e) {
                audio.pause();
                console.log("Volume?",$scope.volume)
                audio.volume = $scope.volume || audio.volume;
                audio.currentTime = $scope.start || 0;

                $timeout(function() {
                    audio.play();
                }, 5);
            });
        }
    };
}])

.service('localAudioFindingService', ['$q', '$timeout', function($q, $timeout) {

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
}])

.service('remoteAudioFindingService', ['$q', function($q) {

    this.find = function(url) {
        var deferred = $q.defer();
        var audio = new Audio();

        audio.addEventListener('error', function(e) {
            deferred.reject();
        });

        audio.addEventListener('loadstart', function(e) {
            deferred.resolve(audio);
        });

        // bugfix for chrome...
        setTimeout(function() {
            audio.src = url;
        }, 1);

        return deferred.promise;

    }
}])

.service('cleverAudioFindingService', ['$q', 'localAudioFindingService', 'remoteAudioFindingService', function($q, localAudioFindingService, remoteAudioFindingService) {
    this.find = function(id) {
        var deferred = $q.defer();

        id = id.replace('|', '/');

        localAudioFindingService.find(id)
            .then(deferred.resolve, function() {
                return remoteAudioFindingService.find(id)
            })
            .then(deferred.resolve, deferred.reject);

        return deferred.promise;
    }
}])

.value('ngAudioGlobals', {
    muting: false,
    songmuting: false
})

.factory("ngAudioObject", ['cleverAudioFindingService', '$rootScope', '$interval', '$timeout', 'ngAudioGlobals', function(cleverAudioFindingService, $rootScope, $interval, $timeout, ngAudioGlobals) {
    return function(id) {

        var PERFORMANCE_MODE = true;

        this.id = id;
        this.safeId = id.replace('/', '|');


        var audio = undefined;
        var audioObject = this;


        var $noWatch = true;
        var $audioWatch;
        var $willPlay = false;
        var $willPause = false;
        var $willRestart = false;
        var $volumeToSet = undefined;
        var $isMuting = false;


        this.play = function() {
            $willPlay = true;
        };

        this.pause = function() {
            $willPause = true;
        };

        this.restart = function() {
            $willRestart = true;
        };

        this.stop = function() {
            this.restart();
        };

        this.setVolume = function(volume) {
            $volumeToSet = volume;
        };

        this.setMuting = function(muting) {
            $isMuting = muting;
        };

        cleverAudioFindingService.find(id)
            .then(function(nativeAudio) {
                audio = nativeAudio;
                audio.addEventListener('canplay', function(e) {
                    audioObject.canPlay = true;
                })
            }, function(error) {
                console.warn("Couldn't load::", id);
                audioObject.error = true;
            });


        this.setProgress = function(progress) {
            if (audio && audio.duration) {
                audio.currentTime = audio.duration * progress;
            }
        };

        this.setCurrentTime = function(currentTime) {
            if (audio && audio.duration) {
                audio.currentTime = currentTime;
            }
        };

        function $setWatch() {
           $audioWatch = $rootScope.$watch(function() {
                return {
                    volume:audioObject.volume,
                    currentTime:audioObject.currentTime,
                    progress:audioObject.progress
                };
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }

                // console.log("setting current time...",newValue);

                // audioObject.setProgress(newValue.currentTime);

                if (newValue.currentTime !== oldValue.currentTime) {
                    audioObject.setCurrentTime(newValue.currentTime);
                }

                if (newValue.progress !== oldValue.progress) {
                    // console.log("Progress changed...");
                    audioObject.setProgress(newValue.progress);
                }
                if (newValue.volume !== oldValue.volume) {
                    audioObject.setVolume(newValue.volume);
                }
                // audioObject.setCurrentTime(newValue.currentTime);
                // audioObject.setMuting(newValue);
            },true); 
        }
           

            // $rootScope.$watch(function() {
            //     return audioObject.volume;
            // }, function(newValue, oldValue) {
            //     if (newValue == oldValue) {
            //         return;
            //     }
            //     audioObject.setVolume(newValue);
            // }, true);

          // $rootScope.$watch(function() {
          //       return audioObject.currentTime;
          //   }, function(newValue, oldValue) {
          //       if (newValue == oldValue) {
          //           return;
          //       }
          //       console.log("setting current time")
          //       audioObject.setCurrentTime(newValue);
          //   }, true);

          //   $rootScope.$watch(function() {
          //       return audioObject.muting;
          //   }, function(newValue, oldValue) {
          //       if (newValue == oldValue) {
          //           return;
          //       }
          //       audioObject.setMuting(newValue);
          //   }, true);

        $interval(function() {
            if ($audioWatch) {
                $audioWatch();
            }
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

                if (!PERFORMANCE_MODE) {
                    audioObject.currentTime = audio.currentTime;
                    audioObject.duration = audio.duration;
                    audioObject.remaining = audio.duration - audio.currentTime;
                    audioObject.progress = audio.currentTime / audio.duration;
                    audioObject.paused = audio.paused;
                    audioObject.src = audio.src;
                } else {
                    audioObject.paused = true;
                }



                if (!$isMuting && !ngAudioGlobals.isMuting) {
                    audioObject.volume = audio.volume;
                }

                audioObject.audio = audio;
            }

            $setWatch();
        }, 1);

        }


}])

.service('ngAudio', ['ngAudioObject', 'ngAudioGlobals', function(ngAudioObject, ngAudioGlobals) {
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


}]);
