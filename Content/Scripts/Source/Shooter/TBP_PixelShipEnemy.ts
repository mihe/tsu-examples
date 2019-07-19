import { Actor } from 'UE/Actor';
import { BP_PixelShipEnemy } from 'UE/BP_PixelShipEnemy';
import { GameplayStatics as KGameplay } from 'UE/GameplayStatics';
import { MathLibrary as KMath } from 'UE/MathLibrary';
import { Pawn } from 'UE/Pawn';
import { Rotator } from 'UE/Rotator';
import { SystemLibrary as KSystem } from 'UE/SystemLibrary';
import { TimelineComponent } from 'UE/TimelineComponent';
import { Vector } from 'UE/Vector';

const trackName = 'Movement';

export function onBeginPlay(target: BP_PixelShipEnemy) {
	target.gameCabinetYaw = target.getInstigator().getActorRotation().yaw;
	target.movementDirection = KMath.randomBool();
	target.movementSpeed = KMath.randomFloatInRange(25, 200);
	target.spawnLocation = target.getActorLocation();

	const projectileDelay = KMath.randomFloatInRange(0.4, 0.8);
	target.nextProjectileTime = KSystem.getGameTimeInSeconds() + projectileDelay;

	const spawnAnimation = TimelineComponent.addTo(target);
	spawnAnimation.setTimelineLength(0.7);
	spawnAnimation.addFloatCurve(trackName, target.spawnAnimationCurve);

	spawnAnimation.setOnFloatUpdate(trackName, value => {
		onAnimate(target, value);
	});

	spawnAnimation.setOnFinished(() => {
		target.movementEnabled = true;
	});

	spawnAnimation.playFromStart();
}

function onAnimate(target: BP_PixelShipEnemy, value: number) {
	const { spawnLocation, gameCabinetYaw } = target;

	const sourceLocation = spawnLocation;
	const targetLocation = sourceLocation.subtract(new Vector(0, 0, 60));
	const location = sourceLocation.lerp(targetLocation, value);
	target.setActorLocation(location);

	const sourceRotation = new Rotator(0, 0, gameCabinetYaw + 180);
	const targetRotation = new Rotator(0, 0, gameCabinetYaw);
	const rotation = sourceRotation.lerp(targetRotation, value, false);
	target.setActorRotation(rotation);
}

export function tick(target: BP_PixelShipEnemy, deltaSeconds: number) {
	tryMove(target, deltaSeconds);
	tryFireProjectile(target);
}

function tryMove(target: BP_PixelShipEnemy, deltaSeconds: number) {
	if (!target.movementEnabled) { return; }

	const speedSign = target.movementDirection ? 1 : -1;
	const speed = target.movementSpeed * speedSign;
	const cabinetRotation = new Rotator(0, 0, target.gameCabinetYaw);
	const velocity = cabinetRotation.rotateVector(new Vector(speed, 0, -45));
	const offset = velocity.multiplyFloat(deltaSeconds);
	target.addActorLocalOffset(offset, true);
}

function tryFireProjectile(target: BP_PixelShipEnemy) {
	if (!target.movementEnabled) { return; }

	const currentTime = KSystem.getGameTimeInSeconds();
	if (currentTime < target.nextProjectileTime) { return; }

	const pawn = KGameplay.getPlayerPawn(0);
	const pawnLocation = pawn.getActorLocation();
	const targetLocation = target.getActorLocation();
	const targetToPawn = pawnLocation.subtract(targetLocation);
	if (targetToPawn.x > 120) { return; }

	target.spawnProjectile(
		target.getActorTransform(),
		new Vector(0, 0, -200),
		target,
		KMath.makeColor(1, 0.3, 0.05)
	);

	const projectileDelay = KMath.randomFloatInRange(0.4, 0.8);
	target.nextProjectileTime = currentTime + projectileDelay;
}

export function onHit(target: BP_PixelShipEnemy, other: Actor) {
	if (other instanceof Pawn) {
		other.applyDamage(90, null, null, null);
		destroy(target);
	} else {
		target.movementDirection = !target.movementDirection;
	}
}

export function onDamage(target: BP_PixelShipEnemy, damage: number) {
	target.health -= damage;

	if (target.health <= 0) {
		destroy(target);
	}
}

function destroy(target: BP_PixelShipEnemy) {
	KGameplay.spawnEmitterAtLocation(
		target.destroyedEffect,
		target.getActorLocation()
	);

	target.destroyActor();
}
