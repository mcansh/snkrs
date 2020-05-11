type ReactSVGElement = React.StatelessComponent<
  React.SVGAttributes<SVGElement>
>;

declare module '*.svg' {
  const content: ReactSVGElement;
  export default content;
}
