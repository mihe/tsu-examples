import { Actor } from 'UE/Actor';
import { BP_PixelProjectile } from 'UE/BP_PixelProjectile';
import { GameplayStatics as KGameplay } from 'UE/GameplayStatics';
import { Rotator } from 'UE/Rotator';
import { Vector } from 'UE/Vector';

export function construct(target: BP_PixelProjectile) {
	target.projectileMaterial = (
		target.projectile.createDynamicMaterialInstance(0)
	);
}

export function onBeginPlay(target: BP_PixelProjectile) {
	const { projectileMaterial, projectileColor, light } = target;
	projectileMaterial.setVectorParameterValue('Color2', projectileColor);
	light.setLightColor(projectileColor);
}

export function move(target: BP_PixelProjectile, deltaSeconds: number) {
	target.addActorLocalOffset(
		target.speed.multiplyFloat(deltaSeconds)
	);
}

export function onImpact(target: BP_PixelProjectile, other: Actor) {
	const { projectileOwner } = target;
	if (projectileOwner && projectileOwner.equals(other)) { return; }

	other.applyDamage(20, null, null, null);

	KGameplay.spawnEmitterAtLocation(
		target.impactEffect,
		target.getActorLocation(),
		new Rotator(0, 0, 0),
		new Vector(1, 1, 1)
	);

	target.destroyActor();
}
