NG-AUDIO
===

Play your sounds with an angular directive.

Description
---
ngAudio is a directive which makes any element you click play a sound. It is designed to be convenient and simple, as opposed to customizable and powerful. Please add and pull request your own features if you'd like them added.

Usage
-----

```html
<script src='lib/angular.js'></script>
<script src='lib/angular.audio.js'></script>

<audio id='click1'>
  <source src="audio/click.mp3" type="audio/mp3">
</audio>

<button ng-audio='click1'>Click me and a sound will play</button>

//No JavaScript required
```

Is it Really That Easy?
-----
It's really that easy.

Tested in:
Chrome