/**
 * Spanish (Spain). Must mirror en_US.ts key-for-key — the build enforces
 * parity in both directions, including each key's {{variable}} set.
 */
export default {
  meta: {
    name: 'Tumbas',
    description: 'Al morir, una tumba guarda todos tus objetos. Ábrela para recuperarlos.',
    creator: 'Bedrock Tweaks, DrAv0011',
  },
  config: {
    groups: {
      access: {
        label: 'Acceso',
        desc: 'Quién puede abrir qué tumbas, y cómo.',
      },
      contents: {
        label: 'Contenido',
        desc: 'Qué guarda una tumba y cómo lo devuelve.',
      },
      capture: {
        label: 'Captura',
        desc: 'El contrato de keepInventory que hace la captura sin pérdidas.',
      },
      lifetime: {
        label: 'Duración',
        desc: 'La desaparición y el límite de tumbas por jugador.',
      },
      protection: {
        label: 'Colocación',
        desc: 'Dónde puede estar una tumba: lava, el vacío, bloques prohibidos.',
      },
    },
    allowRobbing: {
      label: 'Permitir Saqueo De Tumbas',
      desc: 'Si está activado, cualquiera puede abrir la tumba de otro jugador sin llave.',
    },
    graveKeyEnabled: {
      label: 'Llave De Tumba',
      desc: 'Si está activada, una llave de tumba en cualquier mano abre cualquier tumba (se consume una llave).',
    },
    pickUpXp: {
      label: 'Guardar XP',
      desc: 'Las tumbas guardan la experiencia que tenías al morir.',
    },
    xpPercent: {
      label: 'XP Conservada (%)',
      desc: 'Porcentaje de tu experiencia que guarda la tumba.',
    },
    restoreToOriginalSlots: {
      label: 'Restaurar Ranuras Originales',
      desc: 'Abrir la tumba agachado devuelve los objetos a las ranuras donde estaban.',
    },
    enforceKeepInventory: {
      label: 'Forzar keepInventory',
      desc: 'Tumbas necesita la regla keepInventory y la reactiva si algo la desactiva.',
    },
    warnOnGameRuleChange: {
      label: 'Avisar Al Cambiar La Regla',
      desc: 'Avisa a los operadores cuando Tumbas reactiva keepInventory.',
    },
    despawnSeconds: {
      label: 'Tiempo De Desaparición (segundos)',
      desc: 'Las tumbas más antiguas que esto se eliminan con su contenido. 0 lo desactiva.',
    },
    maxGravesPerPlayer: {
      label: 'Máximo De Tumbas Por Jugador',
      desc: 'Límite de tumbas simultáneas por jugador. 0 significa sin límite.',
    },
    onLimitReached: {
      label: 'Al Alcanzar El Límite',
      desc: 'drop_oldest elimina la tumba más antigua; block_new omite la tumba y conservas tus objetos.',
    },
    voidPlatform: {
      label: 'Plataforma Del Vacío',
      desc: 'Coloca un bloque bajo una tumba que caería al vacío.',
    },
    voidRescueY: {
      label: 'Altura De Rescate Del Vacío',
      desc: 'Nivel Y donde se colocan las tumbas del vacío (y su plataforma).',
    },
    voidPlatformBlock: {
      label: 'Bloque De La Plataforma',
      desc: 'El bloque usado para la plataforma de rescate del vacío.',
    },
    floatOnLava: {
      label: 'Flotar En Lava',
      desc: 'Las tumbas flotan sobre bloques de lava en vez de hundirse hasta el fondo.',
    },
    extraImpenetrableBlocks: {
      label: 'Bloques Impenetrables Extra',
      desc: 'Ids de bloques que una tumba nunca debe ocupar ni reemplazar, además de la lista integrada.',
    },
    showDeathToast: {
      label: 'Mostrar Ubicación Al Morir',
      desc: 'Recibe un mensaje con las coordenadas de tu tumba cuando mueres.',
    },
    graveNameStyle: {
      label: 'Nombre De La Tumba',
      desc: 'Qué muestra el nombre flotante sobre tus tumbas.',
    },
  },
  cmd: {
    graves: 'Tumbas: abre tu lista de tumbas.',
    gravekey: 'Tumbas: entrega una llave de tumba.',
    gravesadmin: 'Tumbas: panel de administración, purga y activar/desactivar.',
    notAPlayer: 'Este comando debe ejecutarlo un jugador.',
    keyGiven_one: 'Se dio {{count}} llave de tumba a {{player}}.',
    keyGiven_other: 'Se dieron {{count}} llaves de tumba a {{player}}.',
    keyDisabled: 'La llave de tumba está desactivada en la configuración.',
  },
  death: {
    toast: 'Tu tumba está en {{x}}, {{y}}, {{z}} en {{dimension}}.',
    floating: 'Tu tumba flota sobre el vacío en {{x}}, {{y}}, {{z}} — acércate con cuidado.',
    fallback: 'Tu tumba no se pudo colocar donde moriste; se movió al punto de aparición en {{x}}, {{y}}, {{z}}.',
    capBlocked: 'Ya tienes {{count}} tumbas, así que no se creó una nueva — tus objetos se quedaron contigo.',
    capDropped: 'Superaste el límite de tumbas, así que tu tumba más antigua fue eliminada.',
  },
  open: {
    robbingDisabled: 'El saqueo de tumbas está desactivado.',
    tip: 'Consejo: agáchate e interactúa para cargar la tumba directamente en tu inventario.',
    restored: 'Tus objetos volvieron a su lugar.',
    overflow_one: '{{count}} objeto no cupo y se dejó caer a tus pies.',
    overflow_other: '{{count}} objetos no cupieron y se dejaron caer a tus pies.',
    xp: 'Recuperaste {{amount}} de XP.',
    keyConsumed: 'La llave de tumba se deshace en polvo.',
  },
  grave: {
    name: 'Tumba de {{owner}}',
  },
  item: {
    graveKey: 'Llave De Tumba',
  },
  dim: {
    overworld: 'Mundo Principal',
    nether: 'Nether',
    the_end: 'El End',
  },
  time: {
    now: 'justo ahora',
    minutes: 'hace {{m}}m',
    hours: 'hace {{h}}h {{m}}m',
    days: 'hace {{d}}d {{h}}h',
  },
  list: {
    title: 'Tus Tumbas',
    empty: 'No tienes tumbas. ¡Qué suerte!',
    row_one: '{{count}} objeto — {{xp}} XP',
    row_other: '{{count}} objetos — {{xp}} XP',
    floating: 'flotando sobre el vacío',
  },
  detail: {
    title: 'Tumba',
    owner: 'Dueño',
    dimension: 'Dimensión',
    position: 'Posición',
    items_one: '{{count}} objeto',
    items_other: '{{count}} objetos',
    xp: '{{amount}} XP',
    when: 'Cuándo',
    slainBy: 'Asesinado por {{killer}}',
    cause: 'Causa: {{cause}}',
    pendingPurge: 'Marcada para eliminación — desaparecerá cuando su chunk vuelva a cargarse.',
    teleport: 'Teletransportar',
    purge: 'Purgar',
    close: 'Cerrar',
  },
  admin: {
    title: 'Todas Las Tumbas',
    empty: 'No hay tumbas en este mundo.',
    enabled: 'Tumbas activado — keepInventory vuelve a estar forzado.',
    disabled: 'Tumbas desactivado — keepInventory se restauró a {{value}}.',
    refuseDisable_one: 'Todavía existe {{count}} tumba. Vacíala primero, o usa forcedisable.',
    refuseDisable_other: 'Todavía existen {{count}} tumbas. Vacíalas primero, o usa forcedisable.',
    alreadyEnabled: 'Tumbas ya está activado.',
    alreadyDisabled: 'Tumbas ya está desactivado.',
    purged: 'Se purgaron {{total}} tumbas ({{removed}} eliminadas ahora, {{tombstoned}} pendientes — se eliminan cuando sus chunks vuelvan a cargarse).',
    purgedNone: 'Nada que purgar.',
    purgeStatus_one: '{{count}} tumba está pendiente esperando a que su chunk cargue.',
    purgeStatus_other: '{{count}} tumbas están pendientes esperando a que sus chunks carguen.',
    forcePurgeStart_one: 'Purgando a la fuerza {{count}} tumba con un ticking area — puede tardar.',
    forcePurgeStart_other: 'Purgando a la fuerza {{count}} tumbas con un ticking area — puede tardar.',
    forcePurgeDone: 'Purga forzada terminada: {{count}} tumbas eliminadas físicamente.',
    forcePurgeBusy: 'Ya hay una purga forzada en curso.',
  },
  warn: {
    keepInventoryReasserted: 'Tumbas reactivó la regla keepInventory. Desactiva el addon con /bt_gc_graves:gravesadmin forcedisable si no lo deseas.',
  },
} as const;
