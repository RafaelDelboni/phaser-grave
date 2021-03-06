import Phaser from 'phaser'
import { Experience, Fence, Grave } from '../objects'
import { Skeleton } from '../entities'
import { Spawner } from './helpers'
import { TextBox } from '../ui'
import Audio from '../Audio'

export default class extends Phaser.State {
  _createBackgroundLayer (positionY, sizeX, name, file, color, body) {
    const layer = this.game.add.group(this.world, name)
    for (let i = 0; i <= 1280; i += sizeX) {
      const sprite = this.game.add.sprite(i, positionY, 'atlas', file)
      sprite.tint = color ? Phaser.Color.hexToRGB(color) : 0xffffff
      if (body) {
        this.game.physics.arcade.enable(sprite)
      }
      layer.add(sprite)
    }
    return layer
  }

  _setBackground () {
    this.cloudsBg = this._createBackgroundLayer(
      0,
      640,
      'clouds',
      'bg_clouds',
      '#d2d2d2'
    )
    this.firstLayerBg = this._createBackgroundLayer(
      40,
      416,
      'first',
      'bg_graves_one',
      '#8c8c8c'
    )
    this.secondLayerBg = this._createBackgroundLayer(
      45,
      480,
      'second',
      'bg_graves_two',
      '#787878'
    )
    this.thirdLayerBg = this._createBackgroundLayer(
      38,
      640,
      'third',
      'bg_graves_three',
      '#646464'
    )

    Grave.factory(this.game, 25, 127, 2)
    Grave.factory(this.game, 75, 127, 0)
    Grave.factory(this.game, 92, 127, 2)
    Grave.factory(this.game, 125, 127, 1)
    Grave.factory(this.game, 160, 127, 1)
    Grave.factory(this.game, 1100, 127, 2)
    Grave.factory(this.game, 1115, 127, 2)
    Grave.factory(this.game, 1170, 127, 0)
    Grave.factory(this.game, 1235, 127, 1)

    this.fences = this.game.add.group(this.world, 'fences')
    this.fences.add(new Fence(this.game, 200, 127))
    this.fences.add(new Fence(this.game, 1050, 127))
  }

  _setFloor () {
    this.floorLayerBg = this._createBackgroundLayer(
      116,
      32,
      'floor',
      'bg_grass'
    )

    this.underFloorwallBg = this._createBackgroundLayer(
      148,
      32,
      'under_floor',
      'wall_0',
      null,
      true
    )
    this.underFloorwallBg.setAll('scale.y', 2)
    this.underFloorwallBg.setAll('body.collideWorldBounds', true)
    this.underFloorwallBg.setAll('body.immovable', true)
    this.underFloorwallBg.callAll('body.setSize', 'body', 32, 1)
  }

  _cleanKilledEnemies () {
    this.enemies.filter(enemy => !enemy.sprite.renderable).map(enemy => {
      const index = this.enemies.indexOf(enemy)
      if (index !== -1) {
        this.enemies.splice(index, 1)
      }
    })
  }

  init () {
    this.game.world.setBounds(0, -360, 1280, 540)
    this.game.stage.smoothing = false
    this.enemies = []
    this.game.audio = new Audio(this.game)
    this.game.audio.music.play()
  }

  preload () {
    this._setBackground()
    this._setFloor()
    this.hudCounter = new TextBox(this.game, 'Kills: 0 | Level: 1')
  }

  create () {
    this.player = new Skeleton(
      this.game,
      this.game.add.sprite(300, 123, 'atlas', '')
    )

    this.spawned = this.game.add.group(this.world, 'spawned')
    this.spawner = new Spawner(this.game, this.player, this.enemies)

    this.spawner.enemy('knight', 1008, this.spawned)
    this.spawner.enemy('knight', 608, this.spawned)
    this.spawner.enemy('crow', 672, this.spawned)
    this.spawner.enemy('crow', 1040, this.spawned)

    this.game.camera.setBoundsToWorld()
    this.game.camera.follow(
      this.player.sprite,
      Phaser.Camera.FOLLOW_LOCKON,
      0.1,
      0.1
    )

    this.experiences = this.game.add.group(this.world, 'experience')

    if (this.game.config.isDevelopment) {
      this.fps = new TextBox(this.game, this.game.time.fps, {
        size: 5,
        x: 305,
        y: 170
      })
    }
  }

  update () {
    this.player.update(this.enemies)
    for (const enemie of this.enemies) {
      enemie.update(this.enemies.concat([this.player]))
    }

    this.game.physics.arcade.collide(
      this.player.getHitbox('torso'),
      this.experiences,
      null,
      Experience.collide,
      this
    )

    this.game.physics.arcade.collide(this.player.sprite, this.fences)
    this.game.physics.arcade.collide(
      this.enemies.map(enemie => enemie.sprite),
      this.fences
    )
    this.game.physics.arcade.collide(this.player.bones, this.underFloorwallBg)

    this.cloudsBg.x = this.game.camera.x * 0.95
    this.firstLayerBg.x = this.game.camera.x * 0.85
    this.secondLayerBg.x = this.game.camera.x * 0.65
    this.thirdLayerBg.x = this.game.camera.x * 0.45

    this._cleanKilledEnemies()
    this.hudCounter.update(
      `Kills: ${this.player.killCount}  Level: ${this.player.level.get()}`
    )

    this.spawner.randomEnemy(this.spawned)
  }

  render () {
    this.player.render()
    this.enemies.forEach(enemy => enemy.render())
    this.fences.forEach(fence => fence.render())
    this.experiences.forEach(experience => experience.render())
    if (this.game.config.isDevelopment) {
      this.underFloorwallBg.forEach(wall => this.game.debug.body(wall))
      this.player.sprite.alive &&
        this.game.debug.spriteInfo(this.player.sprite, 32, 32)
      this.fps.update(this.game.time.fps)
    }
  }
}
