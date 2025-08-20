import 'reflect-metadata';
import AppDataSource from './data-source';
import { Team } from './entities/Team';
import { Match } from './entities/Match';

AppDataSource.initialize()
  .then(async () => {
    const equipoRepo = AppDataSource.getRepository(Team);
    const partidoRepo = AppDataSource.getRepository(Match);

    // Crear equipos si no existen
    let barcelona = await equipoRepo.findOneBy({ nombre: 'Barcelona' });
    if (!barcelona) {
      barcelona = equipoRepo.create({ nombre: 'Barcelona', pais: 'España' });
      await equipoRepo.save(barcelona);
      console.log('✅ Equipo creado: Barcelona');
    }

    let realMadrid = await equipoRepo.findOneBy({ nombre: 'Real Madrid' });
    if (!realMadrid) {
      realMadrid = equipoRepo.create({ nombre: 'Real Madrid', pais: 'España' });
      await equipoRepo.save(realMadrid);
      console.log('✅ Equipo creado: Real Madrid');
    }

    // Crear partido si no existe
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7); // +7 días

    const partidoExiste = await partidoRepo.findOne({
      where: {
        equipoLocalId: barcelona.id,
        equipoVisitanteId: realMadrid.id,
        fecha: fecha,
      },
    });

    if (!partidoExiste) {
      const partido = partidoRepo.create({
        equipoLocal: barcelona,
        equipoVisitante: realMadrid,
        fecha,
        jugado: false,
      });
      await partidoRepo.save(partido);
      console.log('✅ Partido creado: Barcelona vs Real Madrid');
    }

    console.log('🎉 Datos de prueba insertados exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error);
  });