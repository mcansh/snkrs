import React from 'react';
import { Form, usePendingFormSubmit } from '@remix-run/react';

// const schema = Yup.object().shape({
//   model: Yup.string().required(),
//   colorway: Yup.string().required(),
//   brand: Yup.string().required(),
//   size: Yup.number().required().min(1),
//   imagePublicId: Yup.string().required(),
//   price: Yup.number().required(),
//   retailPrice: Yup.number().required(),
//   purchaseDate: Yup.date(),
//   sold: Yup.boolean().required().default(false),
//   soldDate: Yup.date()
//     .when('sold', {
//       is: sold => sold === true,
//       then: Yup.date().required('soldDate is required'),
//     })
//     .min(Yup.ref('sold')),
//   soldPrice: Yup.number().when('sold', {
//     is: sold => sold === true,
//     then: Yup.number().required('soldPrice is required'),
//   }),
// });

const meta = () => ({
  title: 'Add a sneaker to your collection',
});

const NewSneakerPage: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();

  return (
    <main className="container min-h-full p-4 mx-auto">
      <h2 className="py-4 text-lg">Add a sneaker to your collection</h2>
      <Form method="post" action="/sneakers/add">
        <fieldset
          disabled={!!pendingForm}
          className="grid items-center gap-2 sm:grid-cols-2"
        >
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Brand"
            name="brand"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Model"
            name="model"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="text"
            placeholder="Colorway"
            name="colorway"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Price"
            name="price"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Retail Price"
            name="retailPrice"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="datetime-local"
            placeholder="Purchase Date"
            name="purchaseDate"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="number"
            placeholder="Size"
            name="size"
          />
          <input
            className="p-1 border-2 border-gray-200 rounded appearance-none"
            type="file"
            name="image"
          />
          <button
            type="submit"
            className="self-start w-auto col-span-2 px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
          >
            Add{!!pendingForm && 'ing'} to collection
          </button>
        </fieldset>
      </Form>
    </main>
  );
};

export default NewSneakerPage;
export { meta };
