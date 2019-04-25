import { Actor } from 'UE/Actor';
import { BP_Saucer } from 'UE/BP_Saucer';
import { EAttachLocation } from 'UE/EAttachLocation';
import { GameplayStatics as KGameplay } from 'UE/GameplayStatics';
import { HitResult } from 'UE/HitResult';
import { MathLibrary as KMath } from 'UE/MathLibrary';
import { ParticleSystem } from 'UE/ParticleSystem';
import { Rotator } from 'UE/Rotator';
import { SceneComponent } from 'UE/SceneComponent';
import { StaticMeshActor } from 'UE/StaticMeshActor';
import { Vector } from 'UE/Vector';

interface Inputs {
	forward: number;
	right: number;
	up: number;
	pitch: number;
	yaw: number;
}

const beamOpacityParam = 'Opacity';
const socketEvacZone = 'Evac zone';

export function construct(target: BP_Saucer) {
	target.beamMaterial = target.beam.createDynamicMaterialInstance(0);
}

export function enableBeam(target: BP_Saucer) {
	target.beamOn = true;
	target.beamLight.setVisibility(true);
	target.beamMaterial.setScalarParameterValue(beamOpacityParam, 0.4);
}

export function disableBeam(target: BP_Saucer) {
	target.beamOn = false;
	target.beamLight.setVisibility(false);
	target.beamMaterial.setScalarParameterValue(beamOpacityParam, 0.01);
}

export function tick(
	target: BP_Saucer,
	deltaTime: number,
	inputForward: number,
	inputRight: number,
	inputUp: number,
	inputPitch: number,
	inputYaw: number
) {
	const inputs: Inputs = {
		forward: inputForward,
		right: inputRight,
		up: inputUp,
		pitch: inputPitch,
		yaw: inputYaw
	};

	spinTop(target, deltaTime);
	updateVelocity(target, deltaTime, inputs);
	updateSpringArm(target, deltaTime, inputs);
	updateCameraAndBody(target, deltaTime, inputs);
	updateFieldOfView(target, deltaTime);
	tryAbduct(target, deltaTime);
}

function spinTop(target: BP_Saucer, deltaTime: number) {
	target.top.addRelativeRotation(new Rotator(0, 0, 180 * deltaTime));
}

function updateVelocity(target: BP_Saucer, deltaTime: number, inputs: Inputs) {
	const inputVector = new Vector(inputs.forward, inputs.right, inputs.up);
	const cameraYaw = target.camera.getWorldRotation().yaw;
	const newVelocity = new Rotator(0, 0, cameraYaw)
		.rotateVector(inputVector)
		.multiplyFloat(target.movementSpeed * deltaTime)
		.add(target.getVelocity());

	target.body.setPhysicsLinearVelocity(newVelocity);
}

function updateSpringArm(target: BP_Saucer, deltaTime: number, inputs: Inputs) {
	const { springArm, cameraSpeed } = target;

	const currentRotation = springArm.getWorldTransform().rotation;
	const currentYaw = currentRotation.yaw;
	const currentPitch = currentRotation.pitch;

	const cameraSpeedInv = cameraSpeed * -1;

	const targetYaw = currentYaw + (cameraSpeed * inputs.yaw);
	let targetPitch = currentPitch + (cameraSpeedInv * inputs.pitch);
	targetPitch = KMath.clampAngle(targetPitch, -45, 85);

	const targetRotation = new Rotator(0, targetPitch, targetYaw);
	const newRotation = currentRotation.interpTo(targetRotation, deltaTime, 8);

	springArm.setWorldRotation(newRotation);
}

function updateCameraAndBody(target: BP_Saucer, deltaTime: number, inputs: Inputs) {
	const { camera } = target;
	const currentCameraTransform = camera.getWorldTransform();
	const currentCameraLocation = currentCameraTransform.location;
	const currentCameraRotation = currentCameraTransform.rotation;

	const currentBodyTransform = target.body.getWorldTransform();
	const currentBodyLocation = currentBodyTransform.location;
	const currentBodyRotation = currentBodyTransform.rotation;

	const targetCameraRotation = KMath.findLookAtRotation(currentCameraLocation, currentBodyLocation);
	const newCameraRotation = currentCameraRotation.interpTo(targetCameraRotation, deltaTime, 2);

	camera.setWorldRotation(newCameraRotation);

	const targetBodyRoll = inputs.right * 20;
	const targetBodyPitch = inputs.forward * -7;
	const targetBodyRotation = new Rotator(targetBodyRoll, targetBodyPitch, targetCameraRotation.yaw);
	const newBodyRotation = currentBodyRotation.interpTo(targetBodyRotation, deltaTime, 4);

	target.setActorRotation(newBodyRotation);
}

function updateFieldOfView(target: BP_Saucer, deltaTime: number) {
	const speed = target.getVelocity().length();
	const targetFov = KMath.mapRangeClamped(speed, 300, 1000, 75, 110);

	const { camera } = target;
	camera.fieldOfView = KMath.finterpTo(camera.fieldOfView, targetFov, deltaTime, 8);
}

function tryAbduct(target: BP_Saucer, deltaTime: number) {
	if (!target.beamOn) { return; }

	const { overlappingActors } = target.beamTrigger.getOverlappingActors();
	if (overlappingActors.length === 0) { return; }

	for (const actor of overlappingActors) {
		if (!(actor instanceof StaticMeshActor)) { continue; }

		const targetPos = target.getActorLocation();
		const actorPos = actor.getActorLocation();

		const currentVelocity = actor.getVelocity();
		const targetVelocity = targetPos
			.subtract(actorPos)
			.getSafeNormal()
			.multiply(new Vector(1, 1, 0.3))
			.multiplyFloat(target.beamStrength);

		const newVelocity = currentVelocity.interpTo(targetVelocity, deltaTime, 5);

		actor.staticMeshComponent.setPhysicsLinearVelocity(newVelocity);
	}
}

export function tryBoost(target: BP_Saucer) {
	if (!target.boostReady) { return; }

	const { body, movementSpeed } = target;
	const { rotation } = body.getWorldTransform();
	const forward = rotation.getForwardVector();
	const newVelocity = forward.withZ(0).multiplyFloat(movementSpeed * 2);

	body.setPhysicsLinearVelocity(newVelocity);

	target.boostReady = false;

	spawnEmitterAttached(
		target.boostEffect,
		target.engine1,
		EAttachLocation.SnapToTarget
	);

	spawnEmitterAttached(
		target.boostEffect,
		target.engine2,
		EAttachLocation.SnapToTarget
	);

	setTimeout(() => {
		target.boostReady = true;
	}, 800);
}

export function onAbducted(target: BP_Saucer, other: Actor) {
	if (!target.beamOn) { return; }
	if (!(other instanceof StaticMeshActor)) { return; }

	other.staticMeshComponent.setSimulatePhysics(false);
	other.staticMeshComponent.setVisibility(false);
	other.setActorEnableCollision(false);
	target.abducted.push(other);

	spawnEmitterAttached(
		target.abductEffect,
		target.body,
		EAttachLocation.KeepRelativeOffset,
		new Vector(0, 0, -10)
	);
}

export function tryEject(target: BP_Saucer) {
	const { abducted } = target;

	const subject = abducted.pop();
	if (!subject) { return; }

	interruptBeam(target);

	const { body } = target;
	const evacLocation = body.getSocketLocation(socketEvacZone);

	subject.staticMeshComponent.setSimulatePhysics(true);
	subject.setActorLocation(evacLocation);
	subject.setActorEnableCollision(true);
	subject.staticMeshComponent.setVisibility(true);

	const subjectVelocity = target
		.getActorRotation()
		.rotateVector(new Vector(0, 0, -1500));

	subject.staticMeshComponent.setPhysicsLinearVelocity(subjectVelocity);
	body.setPhysicsLinearVelocity(subjectVelocity.multiplyFloat(-0.1));

	spawnEmitterAttached(
		target.ejectEffect,
		body,
		EAttachLocation.KeepRelativeOffset,
		new Vector(0, 0, -10)
	);
}

function interruptBeam(target: BP_Saucer) {
	disableBeam(target);
	setTimeout(() => {
		if (target.wantsBeam) {
			enableBeam(target);
		}
	}, 500);
}

export function onImpact(target: BP_Saucer, hit: HitResult) {
	if (target.getVelocity().length() >= 300) {
		KGameplay.spawnEmitterAtLocation(
			target.impactEffect,
			hit.impactPoint
		);
	}
}

function spawnEmitterAttached(
	template: ParticleSystem,
	attachTo: SceneComponent,
	locationType = EAttachLocation.KeepRelativeOffset,
	location = new Vector(0, 0, 0)
) {
	return KGameplay.spawnEmitterAttached(
		template,
		attachTo,
		undefined,
		location,
		undefined,
		undefined,
		locationType
	);
}
