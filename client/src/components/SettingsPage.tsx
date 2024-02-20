import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Rule {
  id: number;
  serial: number;
  name: string;
  category: string;
  subcategory: string;
  new_name: string;
  new_category: string;
  new_subcategory: string;
}

const SettingsPage = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Partial<Rule>>({});

  const refreshRules = () =>
    axios.get('/users/1/rules').then(response => {
      setRules(response.data);
    });

  useEffect(() => {
    refreshRules();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewRule({ ...newRule, [event.target.name]: event.target.value });
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    axios.post('/services/1/rule', newRule).then(response => {
      if (response.data.status === 'ok') {
        refreshRules();
        setNewRule({});
      }
    });
  };

  const handleDelete = (id: number) => {
    axios.delete(`/services/rule/${id}`).then(response => {
      if (response.data.status === 'ok') {
        setRules(rules.filter(rule => rule.id !== id));
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <input
          name="serial"
          value={newRule.serial || ''}
          onChange={handleInputChange}
          placeholder="Serial"
        />
        <input
          name="name"
          value={newRule.name || ''}
          onChange={handleInputChange}
          placeholder="Name"
        />
        <input
          name="category"
          value={newRule.category || ''}
          onChange={handleInputChange}
          placeholder="Category"
        />
        <input
          name="subcategory"
          value={newRule.subcategory || ''}
          onChange={handleInputChange}
          placeholder="Subcategory"
        />
        <input
          name="new_name"
          value={newRule.new_name || ''}
          onChange={handleInputChange}
          placeholder="New Name"
        />
        <input
          name="new_category"
          value={newRule.new_category || ''}
          onChange={handleInputChange}
          placeholder="New Category"
        />
        <input
          name="new_subcategory"
          value={newRule.new_subcategory || ''}
          onChange={handleInputChange}
          placeholder="New Subcategory"
        />
        <button type="submit">Add new rule</button>
      </form>
      <table className="custom-table">
        <thead>
          <tr>
            <th>Serial</th>
            <th>Name</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>New Name</th>
            <th>New Category</th>
            <th>New Subcategory</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => (
            <tr key={rule.id}>
              <td>{rule.serial}</td>
              <td>{rule.name}</td>
              <td>{rule.category}</td>
              <td>{rule.subcategory}</td>
              <td>{rule.new_name}</td>
              <td>{rule.new_category}</td>
              <td>{rule.new_subcategory}</td>
              <td>
                <button onClick={() => handleDelete(rule.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SettingsPage;

/* give me a simple table view that can be updated or new row can be added and deleted for the following table

CREATE TABLE transaction_rules_table
(
  id SERIAL PRIMARY KEY,
  user_id integer,
  serial integer,
  name text,
  category text,
  subcategory text,
  new_name text,
  new_category text,
  new_subcategory text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

the following columns should not be shown into the table
id, user_id, created_at, updated_at 


server api endpoints for the table to be used in the front end are the followings:

router.put(
  '/rule/:id',
  asyncWrapper(async (req, res) => {
    console.log(req.body);
    const id = req.params.id;
    let item = await retrieveRuleById(id);

    // if not empty update
    item.name = req.body.name ? req.body.name : item.name;
    item.category = req.body.category ? req.body.category : item.category;
    item.subcategory = req.body.subcategory ? req.body.subcategory : item.subcategory;
    item.newName = req.body.newName ? req.body.newName : item.newName;
    item.newCategory = req.body.newCategory ? req.body.newCategory : item.newCategory;
    item.newSubcategory = req.body.newSubcategory ? req.body.newSubcategory : item.newSubcategory;
    item.serial = req.body.serial ? req.body.serial : item.serial;

    await updateRule(item);

    res.json({ status: 'ok' });
  })
);

router.post(
  '/:userId/rule',
  asyncWrapper(async (req, res) => {
    console.log(req.body);
    const userId = req.params.userId;
    let item = {};
    // if not empty update
    item.name = req.body.name;
    item.category = req.body.applyRulesForCategory;
    item.subcategory = req.body.subcategory;
    item.newName = req.body.newName;
    item.newCategory = req.body.newCategory;
    item.newSubcategory = req.body.newSubcategory;
    item.serial = req.body.serial;
    item.userId = userId;
    await createRule(item);

    res.json({ status: 'ok' });
  })
);

router.get(
  '/:userId/rules',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const rules = await retrieveRulesByUserId(userId);
    res.json(rules);
  })
);

do not use any library for the table, just use plain html, css and javascript similar to the TransactionTable.tsx
*/
