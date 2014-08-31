angular.module('ngAudio', [])
    .directive('ngAudio', function($compile, $q) {
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

        // console.log('adding listener to...',audio);

        audio.addEventListener('error', function(e) {
            console.log('audio errorer...');
            deferred.reject();
        });

        audio.addEventListener('canplay', function(e) {
            deferred.resolve(audio);
        })

        // bugfix for chrome...
        setTimeout(function(){
          audio.src = url;
        },1);

        return deferred.promise;

    }
})

.service('cleverAudioFindingService', function($q, localAudioFindingService, remoteAudioFindingService) {
    this.find = function(id) {
        var deferred = $q.defer();

        localAudioFindingService.find(id)
            .then(deferred.resolve, function() {
                remoteAudioFindingService.find(id)
                    .then(deferred.resolve, deferred.reject);
            });

        return deferred.promise;
    }
})

.service('ngAudio', function(cleverAudioFindingService) {
    this.play = function(id) {
        console.log("playing", id);
        cleverAudioFindingService.find(id)
            .then(function(ngAudioObject) {
                console.log("resolved,", ngAudioObject);
                ngAudioObject.play();
            })
    }
})
