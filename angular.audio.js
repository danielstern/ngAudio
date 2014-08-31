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
                // ngAudio.play($attrs.ngAudio);
            });

        },
    };
})
.service('localAudioFindingService',function(){

  this.find = function(id) {
    var deferred = $q.defer();
    var $sound = document.getElementById(soundUrl);
    if ($sound) {
      deferred.resolve($sound);  
    } else {
      deferred.reject(id);  
    }
    
    return deferred.promise;
  }
})

.service('remoteAudioFindingService',function(){

  this.find = function(url) {
    var deferred = $q.defer();
    var audio = new Audio();

    audio.src = uri;

    var interval = setInterval(function() {
        if (audio.play) {
            deferred.resolve(audio);
            clearInterval(interval);
        }
    });

    return deferred.promise;

  }
})

.service('cleverAudioFindingService',function($q,localAudioFindingService,remoteAudioFindingService){
  this.find = function(id) {
    var deferred = $q.defer();
    var local = localAudioFindingService.find(id);
    var remote = remoteAudioFindingService.find(id);
    
    $q.all([local,remote],function(results){
      console.log("all strategies resolved",results);
    })
    return deferred.promise;
  }
})

.service('ngAudio',function(){
  this.play = function(id) {
    console.log("playing",id);
  }
})