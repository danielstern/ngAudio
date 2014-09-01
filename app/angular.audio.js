angular.module('ngAudio', [])
    .directive('ngAudio', function($compile, $q, ngAudio) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                /**
              If used as an element, automatically convert to attribute form.
            **/
                // if (element[0].nodeName == 'NG-AUDIO') {
                //     var audio = angular.element(document.createElement('audio'));
                //     audio.attr('ng-audio');

                //     element.attr('id', '');
                //     for (var prop in attrs.$attr) {
                //         audio.attr(prop, attrs[prop]);
                //     }

                //     var el = $compile(audio)(scope);
                //     element.append(audio);
                // }

            },
            controller: function($scope, $attrs, $element,$timeout) {

                var audio = ngAudio.load($attrs.ngAudio);

                // $scope.$watch(function(){
                //     return audio.error;
                // },function(){
                //     if (audio.error) {
                //         console.log("this audio has an error");                        
                //     }
                // })

                $element.on('click', function(e) {
                    audio.pause();
                    audio.volume = $attrs.volume || audio.volume;
                    audio.currentTime = $attrs.start || 0;
                    // audio.currentTime = 0;
                    
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
            // console.log('remote find error');
            deferred.reject();
        });

        audio.addEventListener('loadstart', function(e) {
            // console.log('remote find success',url);
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

        var audio = undefined;
        var audioObject = this;
        var $progressWatch;
        var $volumeWatch;
        var $currentTimeWatch;

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
            $volumeToSet = volume;
        }

        cleverAudioFindingService.find(id)
            .then(function(nativeAudio) {
                audio = nativeAudio;
                // audio.addEventListener('progress',function(e){
                    // console.log("some progress...",e);
                // });
                audio.addEventListener('canplay',function(e){
                    // console.log("can play");
                    audioObject.canPlay = true;
                })
            }, function(error) {
                console.error("Couldn't load::", id);
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
        }

        function $clearWatch() {
            if ($progressWatch) $progressWatch();
            if ($volumeWatch) $volumeWatch();
            if ($currentTimeWatch) $currentTimeWatch();
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
