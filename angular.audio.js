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
        // $timeout(function() {
        if ($sound) {
            deferred.resolve($sound);
        } else {
            deferred.reject(id);
        }
        // },2)

        return deferred.promise;
    }
})

.service('remoteAudioFindingService', function($q) {

    this.find = function(url) {
        var deferred = $q.defer();
        var audio = new Audio();


        window.__audio = audio;

        audio.addEventListener('error', function(e) {
            console.log('audio errorer...');
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

.factory("ngAudioObject", function(cleverAudioFindingService, $rootScope, $interval,$timeout) {
    return function(id) {

        var audio = undefined;
        var audioObject = this;
        var $watch;

        var $willPlay = false;

        this.play = function() {
            $willPlay = true;
        }

        this.restart = function() {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audio.src = audio.src;
            }
        }

        this.setProgress = function(progress) {
          // return;
          audio.pause();
          // audio.src = audio.src;
            audio.currentTime = audio.duration * progress;
          // })
          console.log('setting progress...',progress,audio.duration,audio.currentTime);

        }

        cleverAudioFindingService.find(id)
            .then(function(nativeAudio) {
                audio = nativeAudio;
            }, function(error) {
                console.log("Couldn't load::", id);
                audioObject.error = true;
            });

        function $setWatch() {
            
            $watch = $rootScope.$watch(function() {
                return audioObject.progress;
            }, function(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                console.log("colleciton changed",newValue,oldValue);
                audioObject.setProgress(newValue);

            }, true);
        }


        $interval(function() {
            if ($watch) $watch();
            if (audio) {
                if ($willPlay) {
                    audio.play();
                    $willPlay = false;
                }
                audioObject.currentTime = audio.currentTime;
                audioObject.duration = audio.duration;
                audioObject.remaining = audio.duration - audio.currentTime;
                audioObject.progress = audio.currentTime / audio.duration;
                audioObject.src = audio.src;

                // testing only
                audioObject.audio = audio;
            }
            $setWatch();
        })
    }
})

.service('ngAudio', function(ngAudioObject) {
    this.play = function(id) {
        var audio = new ngAudioObject(id);
        audio.play();
        return audio;
    }

    this.load = function(id) {
        return new ngAudioObject(id);
    }
})
