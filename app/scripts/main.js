angular.module("ngAudioDemo", ['ngAudio', 'ui.router'])
    .config(function($urlRouterProvider, $stateProvider) {
        // $urlRouterProvider
        $stateProvider
            .state("home", {
                url: "/",
                templateUrl:"partial/ngAudioDocs.html"
            })

        //  .state('test',{
        //  		url:"/test",
        //  		template:"TEST"
        //  })
       
       	// .state('audio',{
       		// abstract:true,
            // url:"/"
       	// 	url:"/audio"
       	// })

        .state("audio", {
            url: "/audio",
            templateUrl: "partial/audioFullView.html",
            // templateUrl: "partial/audioEditView.html",
            
        })

        .state('audio.detail',{
            url:"/:id",
            templateUrl: "partial/audioEditView.html",
            controller: function($stateParams, $scope, ngAudio) {
                console.log("controller init...");
                $scope.audio = ngAudio.load($stateParams.id);
            }
        })



        $urlRouterProvider.otherwise('/');


    })
    .controller('Demo', function($scope, ngAudio) {
        $scope.audios = [
            ngAudio.load('audio/beer-pour-glass.mp3'),
            ngAudio.load('audio/candy-bag-rustle.mp3'),
            ngAudio.load('audio/falling-whistle.mp3'),
            ngAudio.load('audio/ice-cubes-clink.mp3'),
            ngAudio.load('audio/marker-writing.mp3'),
            ngAudio.load('audio/magic-chime.mp3'),
            ngAudio.load('audio/van-large-pass-by.mp3'),

        ]
    })
