import { Actor } from 'UE/Actor';
import { BP_PixelGame } from 'UE/BP_PixelGame';
import { BP_PixelShipEnemy } from 'UE/BP_PixelShipEnemy';
import { EViewTargetBlendFunction } from 'UE/EViewTargetBlendFunction';
import { GameplayStatics as KGameplay } from 'UE/GameplayStatics';
import { MathLibrary as KMath } from 'UE/MathLibrary';
import { SystemLibrary as KSystem } from 'UE/SystemLibrary';
import { TimelineComponent } from 'UE/TimelineComponent';
import { Transform } from 'UE/Transform';
import { Vector } from 'UE/Vector';

const cameraShakeTrack = 'Offset';

export function construct(target: BP_PixelGame) {
	target.playerSpawnPoint.setRelativeLocation(target.playerSpawnLocation);
	target.enemySpawnPoint.setRelativeLocation(target.enemySpawnLocation);
	target.trigger.setRelativeLocation(target.triggerLocation);
}

export function onBeginPlay(target: BP_PixelGame) {
	const cameraShake = TimelineComponent.addTo(target);
	cameraShake.setTimelineLength(0.4);
	cameraShake.addVectorCurve(cameraShakeTrack, target.cameraShakeCurve);
	target.cameraShake = cameraShake;
}

export function startGame(target: BP_PixelGame) {
	target.spawnInterval = 4;
	target.spawningEnemies = true;
	target.nextSpawnTime = KSystem.getGameTimeInSeconds() + target.spawnInterval;

	const controller = KGameplay.getPlayerController(0);
	const spawnTransform = target.playerSpawnPoint.getWorldTransform();
	const playerShip = target.spawnPlayer(spawnTransform);

	playerShip.onDestroyed.add(() => onPlayerDestroyed(target));

	controller.possess(playerShip);

	controller.setViewTargetWithBlend(
		target,
		1,
		EViewTargetBlendFunction.VTBlend_EaseInOut,
		3,
		true);

	target.playerShip = playerShip;
	target.canReset = true;
}

export function quitGame(target: BP_PixelGame) {
	target.canReset = false;

	const { playerShip } = target;
	if (playerShip && playerShip.isValid()) {
		playerShip.destroyActor();
	}
}

function resetGame(target: BP_PixelGame) {
	for (const enemy of target.spawnedEnemies) {
		if (enemy && enemy.isValid()) {
			enemy.destroyActor();
		}
	}

	if (target.canReset) {
		startGame(target);
	}
}

function playCameraShake(target: BP_PixelGame, intensity: number) {
	const { cameraShake, camera } = target;

	cameraShake.setOnVectorUpdate(cameraShakeTrack, value => {
		camera.setRelativeLocation(value.multiplyFloat(intensity));
	});

	cameraShake.playFromStart();
}

export function tick(target: BP_PixelGame) {
	trySpawnEnemy(target);
}

function trySpawnEnemy(target: BP_PixelGame) {
	if (!target.spawningEnemies) { return; }

	const currentTime = KSystem.getGameTimeInSeconds();
	if (currentTime < target.nextSpawnTime) { return; }

	const spawnTransform = target.enemySpawnPoint.getWorldTransform();

	const spawnOffsetY = KMath.randomFloatInRange(
		target.maxHorizontalSpawnOffset,
		target.maxHorizontalSpawnOffset * -1
	);

	const spawnOffset = target.getActorRotation().rotateVector(
		new Vector(0, spawnOffsetY, 0)
	);

	const enemyTransform = new Transform(
		spawnTransform.location.add(spawnOffset),
		spawnTransform.rotation,
		new Vector(1, 1, 1)
	);

	const enemy = target.spawnEnemy(enemyTransform);

	enemy.onDestroyed.add(() => {
		playCameraShake(target, 3);
	});

	target.spawnedEnemies.push(enemy);

	const spawnDelay = KMath.randomFloatInRange(
		target.spawnInterval,
		target.spawnInterval + 2
	);

	target.nextSpawnTime = currentTime + spawnDelay;
	target.spawnInterval = KMath.fmax(target.spawnInterval - 0.3, 0.7);
}

function onPlayerDestroyed(target: BP_PixelGame) {
	target.spawningEnemies = false;

	const controller = KGameplay.getPlayerController(0);
	controller.setViewTargetWithBlend(target);

	resetGame(target);
}

export function onBottomOverlap(other: Actor) {
	if (other instanceof BP_PixelShipEnemy) {
		other.destroyActor();
	}
}
