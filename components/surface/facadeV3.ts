
// Facade V3 - Trapèze support

export function computeTrapezeArea(top, bottom, height) {
  return ((top + bottom) / 2) * height;
}

export const FACADE_TYPES = [
  {
    type: 'rectangle',
    label: 'Rectangle',
    image: require('../../assets/images/facade/rectangle.png'),
    calc: ({ width, height }) => width * height,
  },
  {
    type: 'pignon',
    label: 'Pignon',
    image: require('../../assets/images/facade/pignon.png'),
    calc: ({ base, height }) => (base * height) / 2,
  },
  {
    type: 'trapeze',
    label: 'Trapèze',
    image: require('../../assets/images/facade/trapeze.png'),
    calc: ({ top, bottom, height }) =>
      ((top + bottom) / 2) * height,
  },
];
