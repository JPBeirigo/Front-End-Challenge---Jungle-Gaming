import type { NFTItem, User, Wallet } from '../../shared/types/contracts';

export const INITIAL_USERS: User[] = [
  {
    id: "user_1",
    name: "Alexandre Silveira",
    email: "alexandre@example.com",
    avatarUrl: "/assets/images/avatars/1535713875002-d1d0cf377fde.jpg",
    bio: "Colecionador de arte digital generativa e entusiasta de Web3 desde 2021.",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "user_2",
    name: "Beatriz Santos",
    email: "beatriz@example.com",
    avatarUrl: "/assets/images/avatars/1494790108377-be9c29b29330.jpg",
    bio: "Curadora independente focada em fotografia contemporânea e mundos virtuais.",
    createdAt: "2024-03-20T14:30:00Z"
  }
];

export const INITIAL_WALLETS: Record<string, Wallet[]> = {
  user_1: [
    {
      id: "wallet_1_1",
      userId: "user_1",
      address: "0x71C...a897",
      name: "MetaMask Principal",
      type: "primary",
      network: "Ethereum Mainnet",
      balanceEth: "4.8500",
      isDefault: true,
      createdAt: "2024-01-16T11:00:00Z"
    },
    {
      id: "wallet_1_2",
      userId: "user_1",
      address: "0x38F...91c2",
      name: "Hardware Wallet Vault",
      type: "secondary",
      network: "Sepolia Testnet",
      balanceEth: "12.5000",
      isDefault: false,
      createdAt: "2024-02-01T09:15:00Z"
    }
  ],
  user_2: [
    {
      id: "wallet_2_1",
      userId: "user_2",
      address: "0x94B...d721",
      name: "Coinbase Wallet",
      type: "primary",
      network: "Ethereum Mainnet",
      balanceEth: "2.1400",
      isDefault: true,
      createdAt: "2024-03-21T16:00:00Z"
    }
  ]
};

export const INITIAL_NFTS: NFTItem[] = [
  {
    id: "nft_1",
    title: "Ether Sentinel #01",
    creator: {
      id: "creator_1",
      name: "Studio Nebula",
      avatarUrl: "/assets/images/avatars/1570295999919-56ceb5ecca61.jpg",
      verified: true
    },
    description: "Guardião etéreo forjado na convergência de luz e dados algorítmicos. Primeira iteração da série Celestial Sentinels.",
    imageUrl: "/assets/images/nfts/1618005182384-a83a8bd57fbe.jpg",
    priceEth: "0.8500",
    currency: "ETH",
    category: "art",
    totalAvailable: 3,
    editions: [
      { id: "ed_1_1", editionNumber: 1, totalEditions: 5, available: false, priceEth: "0.8500" },
      { id: "ed_1_2", editionNumber: 2, totalEditions: 5, available: false, priceEth: "0.8500" },
      { id: "ed_1_3", editionNumber: 3, totalEditions: 5, available: true, priceEth: "0.8500" },
      { id: "ed_1_4", editionNumber: 4, totalEditions: 5, available: true, priceEth: "0.8500" },
      { id: "ed_1_5", editionNumber: 5, totalEditions: 5, available: true, priceEth: "0.8500" }
    ],
    viewsCount: 1420,
    likesCount: 388,
    featured: true,
    version: 1
  },
  {
    id: "nft_2",
    title: "Cyber Geisha Genesis",
    creator: {
      id: "creator_2",
      name: "Akira Tanaka",
      avatarUrl: "/assets/images/avatars/1507003211169-0a1dd7228f2d.jpg",
      verified: true
    },
    description: "Fusão neo-futurista de tradição clássica e interfaces cibernéticas de alta densidade neural.",
    imageUrl: "/assets/images/nfts/1634017839464-5c339ebe3cb4.jpg",
    priceEth: "1.4500",
    currency: "ETH",
    category: "collectibles",
    totalAvailable: 2,
    editions: [
      { id: "ed_2_1", editionNumber: 1, totalEditions: 3, available: false, priceEth: "1.4500" },
      { id: "ed_2_2", editionNumber: 2, totalEditions: 3, available: true, priceEth: "1.4500" },
      { id: "ed_2_3", editionNumber: 3, totalEditions: 3, available: true, priceEth: "1.4500" }
    ],
    viewsCount: 2850,
    likesCount: 612,
    featured: true,
    version: 1
  },
  {
    id: "nft_3",
    title: "Obsidian Horizon",
    creator: {
      id: "creator_3",
      name: "Elena Rostova",
      avatarUrl: "/assets/images/avatars/1534528741775-53994a69daeb.jpg",
      verified: true
    },
    description: "Estudo topográfico de paisagens vulcânicas capturadas em infravermelho de alta resolução.",
    imageUrl: "/assets/images/nfts/1618005182384-a83a8bd57fbe.jpg",
    priceEth: "0.3200",
    currency: "ETH",
    category: "photography",
    totalAvailable: 4,
    editions: [
      { id: "ed_3_1", editionNumber: 1, totalEditions: 4, available: true, priceEth: "0.3200" },
      { id: "ed_3_2", editionNumber: 2, totalEditions: 4, available: true, priceEth: "0.3200" },
      { id: "ed_3_3", editionNumber: 3, totalEditions: 4, available: true, priceEth: "0.3200" },
      { id: "ed_3_4", editionNumber: 4, totalEditions: 4, available: true, priceEth: "0.3200" }
    ],
    viewsCount: 940,
    likesCount: 175,
    featured: false,
    version: 1
  },
  {
    id: "nft_4",
    title: "Aethelgard Citadel",
    creator: {
      id: "creator_1",
      name: "Studio Nebula",
      avatarUrl: "/assets/images/avatars/1570295999919-56ceb5ecca61.jpg",
      verified: true
    },
    description: "Metrópole suspensa em órbita de supernova, modelada proceduralmente para o Metaverso.",
    imageUrl: "/assets/images/nfts/1614741118887-7a4ee193a5fa.jpg",
    priceEth: "2.8000",
    currency: "ETH",
    category: "virtual-worlds",
    totalAvailable: 1,
    editions: [
      { id: "ed_4_1", editionNumber: 1, totalEditions: 2, available: false, priceEth: "2.8000" },
      { id: "ed_4_2", editionNumber: 2, totalEditions: 2, available: true, priceEth: "2.8000" }
    ],
    viewsCount: 3100,
    likesCount: 780,
    featured: true,
    version: 1
  },
  {
    id: "nft_5",
    title: "Neon Ronin #404",
    creator: {
      id: "creator_2",
      name: "Akira Tanaka",
      avatarUrl: "/assets/images/avatars/1507003211169-0a1dd7228f2d.jpg",
      verified: true
    },
    description: "Andarilho sem mestre nos becos de Neo-Kyoto. Equipado com katana de plasma de alta frequência.",
    imageUrl: "/assets/images/nfts/1563089145-599997674d42.jpg",
    priceEth: "0.6500",
    currency: "ETH",
    category: "collectibles",
    totalAvailable: 5,
    editions: [
      { id: "ed_5_1", editionNumber: 1, totalEditions: 5, available: true, priceEth: "0.6500" },
      { id: "ed_5_2", editionNumber: 2, totalEditions: 5, available: true, priceEth: "0.6500" },
      { id: "ed_5_3", editionNumber: 3, totalEditions: 5, available: true, priceEth: "0.6500" },
      { id: "ed_5_4", editionNumber: 4, totalEditions: 5, available: true, priceEth: "0.6500" },
      { id: "ed_5_5", editionNumber: 5, totalEditions: 5, available: true, priceEth: "0.6500" }
    ],
    viewsCount: 1220,
    likesCount: 410,
    featured: false,
    version: 1
  },
  {
    id: "nft_6",
    title: "Chromatic Echoes",
    creator: {
      id: "creator_4",
      name: "Maya Lin",
      avatarUrl: "/assets/images/avatars/1517841905240-472988babdf9.jpg",
      verified: false
    },
    description: "Composição de ondas sonoras traduzidas em espectros cromáticos tridimensionais.",
    imageUrl: "/assets/images/nfts/1550684848-fac1c5b4e853.jpg",
    priceEth: "0.1800",
    currency: "ETH",
    category: "art",
    totalAvailable: 8,
    editions: [
      { id: "ed_6_1", editionNumber: 1, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_2", editionNumber: 2, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_3", editionNumber: 3, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_4", editionNumber: 4, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_5", editionNumber: 5, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_6", editionNumber: 6, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_7", editionNumber: 7, totalEditions: 8, available: true, priceEth: "0.1800" },
      { id: "ed_6_8", editionNumber: 8, totalEditions: 8, available: true, priceEth: "0.1800" }
    ],
    viewsCount: 780,
    likesCount: 95,
    featured: false,
    version: 1
  },
  {
    id: "nft_7",
    title: "Solitude in Antarctica",
    creator: {
      id: "creator_3",
      name: "Elena Rostova",
      avatarUrl: "/assets/images/avatars/1534528741775-53994a69daeb.jpg",
      verified: true
    },
    description: "Expedição solitária de 40 dias no platô polar antártico. Fotografia premiada internacionalmente.",
    imageUrl: "/assets/images/nfts/1517999144091-3d9dca6d1e43.jpg",
    priceEth: "0.7500",
    currency: "ETH",
    category: "photography",
    totalAvailable: 2,
    editions: [
      { id: "ed_7_1", editionNumber: 1, totalEditions: 2, available: true, priceEth: "0.7500" },
      { id: "ed_7_2", editionNumber: 2, totalEditions: 2, available: true, priceEth: "0.7500" }
    ],
    viewsCount: 1680,
    likesCount: 320,
    featured: false,
    version: 1
  },
  {
    id: "nft_8",
    title: "Quantum Shard Matrix",
    creator: {
      id: "creator_5",
      name: "Devon Vance",
      avatarUrl: "/assets/images/avatars/1500648767791-00dcc994a43e.jpg",
      verified: true
    },
    description: "Fragmento de realidade simulada encapsulado em geometria fractal cristalina.",
    imageUrl: "/assets/images/nfts/1620641788421-7a1c342ea42e.jpg",
    priceEth: "1.9500",
    currency: "ETH",
    category: "virtual-worlds",
    totalAvailable: 3,
    editions: [
      { id: "ed_8_1", editionNumber: 1, totalEditions: 3, available: true, priceEth: "1.9500" },
      { id: "ed_8_2", editionNumber: 2, totalEditions: 3, available: true, priceEth: "1.9500" },
      { id: "ed_8_3", editionNumber: 3, totalEditions: 3, available: true, priceEth: "1.9500" }
    ],
    viewsCount: 2150,
    likesCount: 540,
    featured: true,
    version: 1
  },
  {
    id: "nft_9",
    title: "Glitch Phoenix",
    creator: {
      id: "creator_4",
      name: "Maya Lin",
      avatarUrl: "/assets/images/avatars/1517841905240-472988babdf9.jpg",
      verified: false
    },
    description: "O renascimento da fênix digital através da desconstrução de memória e buffer overflow.",
    imageUrl: "/assets/images/nfts/1579783900882-c0d3dad7b119.jpg",
    priceEth: "0.4200",
    currency: "ETH",
    category: "art",
    totalAvailable: 4,
    editions: [
      { id: "ed_9_1", editionNumber: 1, totalEditions: 4, available: true, priceEth: "0.4200" },
      { id: "ed_9_2", editionNumber: 2, totalEditions: 4, available: true, priceEth: "0.4200" },
      { id: "ed_9_3", editionNumber: 3, totalEditions: 4, available: true, priceEth: "0.4200" },
      { id: "ed_9_4", editionNumber: 4, totalEditions: 4, available: true, priceEth: "0.4200" }
    ],
    viewsCount: 890,
    likesCount: 230,
    featured: false,
    version: 1
  },
  {
    id: "nft_10",
    title: "Apex Mech Suit #09",
    creator: {
      id: "creator_2",
      name: "Akira Tanaka",
      avatarUrl: "/assets/images/avatars/1507003211169-0a1dd7228f2d.jpg",
      verified: true
    },
    description: "Armadura pesada de combate com propulsores gravitacionais e escudo defletor de táquions.",
    imageUrl: "/assets/images/nfts/1578632767115-351597cf2477.jpg",
    priceEth: "3.1000",
    currency: "ETH",
    category: "collectibles",
    totalAvailable: 1,
    editions: [
      { id: "ed_10_1", editionNumber: 1, totalEditions: 2, available: false, priceEth: "3.1000" },
      { id: "ed_10_2", editionNumber: 2, totalEditions: 2, available: true, priceEth: "3.1000" }
    ],
    viewsCount: 4200,
    likesCount: 1120,
    featured: false,
    version: 1
  },
  {
    id: "nft_11",
    title: "Neon Tokyo Rain",
    creator: {
      id: "creator_3",
      name: "Elena Rostova",
      avatarUrl: "/assets/images/avatars/1534528741775-53994a69daeb.jpg",
      verified: true
    },
    description: "Chuva noturna em Shinjuku refletindo os hologramas publicitários dos arranha-céus.",
    imageUrl: "/assets/images/nfts/1509198397868-475647b2a1e5.jpg",
    priceEth: "0.5500",
    currency: "ETH",
    category: "photography",
    totalAvailable: 3,
    editions: [
      { id: "ed_11_1", editionNumber: 1, totalEditions: 3, available: true, priceEth: "0.5500" },
      { id: "ed_11_2", editionNumber: 2, totalEditions: 3, available: true, priceEth: "0.5500" },
      { id: "ed_11_3", editionNumber: 3, totalEditions: 3, available: true, priceEth: "0.5500" }
    ],
    viewsCount: 1390,
    likesCount: 290,
    featured: false,
    version: 1
  },
  {
    id: "nft_12",
    title: "Sub-Zero Sanctuary",
    creator: {
      id: "creator_5",
      name: "Devon Vance",
      avatarUrl: "/assets/images/avatars/1500648767791-00dcc994a43e.jpg",
      verified: true
    },
    description: "Oásis geotérmico esculpido sob quilômetros de gelo no polo norte de Titã.",
    imageUrl: "/assets/images/nfts/1518709268805-4e9042af9f23.jpg",
    priceEth: "1.2000",
    currency: "ETH",
    category: "virtual-worlds",
    totalAvailable: 2,
    editions: [
      { id: "ed_12_1", editionNumber: 1, totalEditions: 2, available: true, priceEth: "1.2000" },
      { id: "ed_12_2", editionNumber: 2, totalEditions: 2, available: true, priceEth: "1.2000" }
    ],
    viewsCount: 1750,
    likesCount: 460,
    featured: false,
    version: 1
  }
];

export const INITIAL_COUPONS: Record<string, { code: string; discountPercentage: number; valid: boolean; expired: boolean }> = {
  WELCOME10: {
    code: "WELCOME10",
    discountPercentage: 10,
    valid: true,
    expired: false
  },
  DISCOUNT10: {
    code: "DISCOUNT10",
    discountPercentage: 10,
    valid: true,
    expired: false
  },
  EXPIRED50: {
    code: "EXPIRED50",
    discountPercentage: 50,
    valid: false,
    expired: true
  }
};