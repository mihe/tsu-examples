import { BP_PixelShipPlayer } from 'UE/BP_PixelShipPlayer';
import { GameplayStatics as KGameplay } from 'UE/GameplayStatics';
import { MathLibrary as KMath } from 'UE/MathLibrary';
import { Rotator } from 'UE/Rotator';
import { TimelineComponent } from 'UE/TimelineComponent';
import { Vector } from 'UE/Vector';

const trackName = 'Movement';

export function onBeginPlay(target: BP_PixelShipPlayer) {
	target.gameCabinetYaw = target.getInstigator().getActorRotation().yaw;
	target.spawnLocation = target.getActorLocation();

	const spawnAnimation = TimelineComponent.addTo(target);
	spawnAnimation.setTimelineLength(1);
	spawnAnimation.addFloatCurve(trackName, target.spawnAnimationCurve);

	spawnAnimation.setOnFloatUpdate(trackName, value => {
		onAnimate(target, value);
	});

	spawnAnimation.setOnFinished(() => {
		target.movementEnabled = true;
	});

	spawnAnimation.playFromStart();
}

function onAnimate(target: BP_PixelShipPlayer, alpha: number) {
	const { spawnLocation, gameCabinetYaw } = target;

	const sourceLocation = spawnLocation;
	const targetLocation = sourceLocation.add(new Vector(0, 0, 60));
	const location = sourceLocation.lerp(targetLocation, alpha);
	target.setActorLocation(location);

	const sourceRotation = new Rotator(0, 0, gameCabinetYaw + 720);
	const targetRotation = new Rotator(0, 0, gameCabinetYaw);
	const rotation = sourceRotation.lerp(targetRotation, alpha, false);
	target.setActorRotation(rotation);
}

export function tick(target: BP_PixelShipPlayer) {
	if (!target.movementEnabled) { return; }

	const deltaSeconds = KGameplay.getWorldDeltaSeconds();

	const step = target.axisMoveRight * target.movementSpeed;
	const desiredSpeed = step * deltaSeconds;
	target.speed = KMath.finterpTo(target.speed, desiredSpeed, deltaSeconds, 4);

	const velocity = new Vector(target.speed, 0, 0);
	const cabinetRotation = new Rotator(0, 0, target.gameCabinetYaw);
	const offset = cabinetRotation.rotateVector(velocity);

	target.addActorWorldOffset(offset, true);

	const yaw = target.gameCabinetYaw + (target.speed * -5);
	const targetRotation = new Rotator(0, 0, yaw);
	const currentRotation = target.getActorRotation();
	const newRotation = currentRotation.interpTo(targetRotation, deltaSeconds, 20);

	target.setActorRotation(newRotation);
}

export function startFiring(target: BP_PixelShipPlayer) {
	if (!target.movementEnabled) { return; }

	fireProjectile(target);

	target.fireTimerHandle = setInterval(() => {
		fireProjectile(target);
	}, 200);
}

function fireProjectile(target: BP_PixelShipPlayer) {
	target.spawnProjectile(
		target.getActorTransform(),
		new Vector(0, 0, 700),
		target,
		KMath.makeColor(0.2, 0.5, 1, 1)
	);
}

export function stopFiring(target: BP_PixelShipPlayer) {
	const { fireTimerHandle } = target;
	if (fireTimerHandle.isValidTimerHandle()) {
		clearInterval(fireTimerHandle);
	}
}

export function onDamage(target: BP_PixelShipPlayer, damage: number) {
	target.speed *= -0.5;
	target.health -= damage;

	if (target.health <= 0) {
		KGameplay.spawnEmitterAtLocation(
			target.destroyedEffect,
			target.getActorLocation()
		);

		target.destroyActor();
	}
}
