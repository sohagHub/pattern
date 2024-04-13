import React, { useState, useEffect } from 'react';

import {
  getRulesByUser,
  addRuleForUser,
  updateRuleForUserById,
  deleteRuleForUserById,
} from '../services/api';
import { useCurrentUser } from '../services';

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
  const { userState } = useCurrentUser();
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Partial<Rule>>({});

  const refreshRules = () =>
    getRulesByUser(userState.currentUser.id).then(response => {
      setRules(response.data);
    });

  useEffect(() => {
    refreshRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewRule({ ...newRule, [event.target.name]: event.target.value });
  };

  // Modify the handleFormSubmit handler to also handle updates
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingRule && editingRule.id) {
      // If we're editing an existing rule, call the update API endpoint
      updateRuleForUserById(
        userState.currentUser.id,
        editingRule.id,
        newRule
      ).then(response => {
        if (response.data.status === 'ok') {
          refreshRules();
          setNewRule({});
          setEditingRule({}); // Clear the editing rule
        }
      });
    } else {
      // If we're adding a new rule, call the add API endpoint
      addRuleForUser(userState.currentUser.id, newRule).then(response => {
        if (response.data.status === 'ok') {
          refreshRules();
          setNewRule({});
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteRuleForUserById(userState.currentUser.id, id).then(response => {
      if (response.data.status === 'ok') {
        setRules(rules.filter(rule => rule.id !== id));
      }
    });
  };

  // Add a new state variable to hold the rule being edited
  const [editingRule, setEditingRule] = useState<Partial<Rule>>({});

  // Add a new handler for the Edit button
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
  };

  // Populate the form with the data from the editing rule when it's set
  useEffect(() => {
    if (editingRule) {
      setNewRule(editingRule);
    }
  }, [editingRule]);

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
                <button onClick={() => handleEdit(rule)}>Edit</button>
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
